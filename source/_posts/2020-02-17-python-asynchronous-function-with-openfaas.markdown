---
layout: post
title: "Asynchronous Function with OpenFaas"
date: 2020-02-17 23:51:22 +0200
comments: true
categories: ["python", "openfaas"] 
---

In this post we will explore how to use asynchronous functions in OpenFaas.

## What are we doing

A synchronous request blocks the client until operation completes, where a asynchronous request doesn’t block the client, which is nice to use for long-running tasks or function invocations to run in the background through the use of NATS Streaming.

We will be building a Python Flask API Server which will act as our webhook service. When we invoke our function by making a http request, we also include a callback url as a header which will be the address where the queue worker will post it's results. 

Then we will make a http request to the synchronous function where we will get the response from the function and a http request to the asynchronous function, where we will get the response from the webhook service's logs

## Deploy OpenFaas

Deploy OpenFaas on a k3d Kubernetes Cluster if you want to follow along on your laptop. You can follow this post to deploy a kubernetes cluster and deploying openfaas:
- https://blog.ruanbekker.com/blog/2020/02/17/traefik-ingress-for-openfaas-on-kubernetes-k3d/

## Webhook Service

Lets build the Python Flask Webhook Service, our application code:

```python
from flask import Flask, request
from logging.config import dictConfig

dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

app = Flask(__name__)

@app.route("/", methods=["POST", "GET"])
def main():
    response = {}
    
    if request.method == "GET":
        response["event"] = "GET"
        app.logger.info("Received Event: GET")
        
    if request.method == "POST":
        response["event"] = request.get_data()
        app.logger.info("Receveid Event: {}".format(response))
        
    else:
        response["event"] == "OTHER"

    print("Received Event:")
    print(response)
    return "event: {} \n".format(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

Our `Dockerfile`:

```
FROM python:3.7-alpine
RUN pip install flask
ADD app.py /app.py
EXPOSE 5000
CMD ["python", "/app.py"]
```

Building and Pushing to Docker Hub (or you can use my docker image):

```
$ docker build -t yourusername/python-flask-webhook:openfaas .
$ docker push yourusername/python-flask-webhook:openfaas
```

Create the deployment manifest `webhook.yml` for our webhook service:

```
$ cat > webhook.yml << EOF
apiVersion: v1
kind: Service
metadata:
  name: webhook-service
spec:
  selector:
    app: webhook
  ports:
    - protocol: TCP
      port: 5000
      targetPort: 5000
      name: web
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: webhook-ingress
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: webhook.localdns.xyz
    http:
      paths:
      - backend:
          serviceName: webhook-service
          servicePort: 5000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: webhook
  name: webhook
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webhook
  template:
    metadata:
      labels:
        app: webhook
    spec:
      containers:
      - name: webhook
        image: ruanbekker/python-flask-webhook:openfaas
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5000
          name: http
          protocol: TCP
EOF
```

Now deploy to kubernetes:

```
$ kubectl apply -f webhook.yml
````

After a minute or so, verify that you get a response when making a http request:

```
$ curl http://webhook.localdns.xyz
event: {'event': 'GET'}
```

## Deploy the OpenFaas Function

We will deploy a dockerfile type function which will return the data that we feed it:

```
$ faas-cli new --lang dockerfile function-async-task
$ faas-cli up -f function-async-task.yml

Deploying: function-async-task.

Deployed. 202 Accepted.
URL: http://openfaas.localdns.xyz/function/function-async-task
```

List the functions:

```
$ faas-cli list
Function                      	Invocations    	Replicas
function-async-task           	0              	1
```

Describe the function:

```
$ faas-cli describe function-async-task
Name:                function-async-task
Status:              Ready
Replicas:            1
Available replicas:  1
Invocations:         0
Image:               ruanbekker/function-async-task:latest
Function process:
URL:                 http://openfaas.localdns.xyz/function/function-async-task
Async URL:           http://openfaas.localdns.xyz/async-function/function-async-task
Labels:              faas_function : function-async-task
Annotations:         prometheus.io.scrape : false
```

## Testing

Test synchronous function:

```
$ curl http://openfaas.localdns.xyz/function/function-async-task -d "test"
test
```

Test asynchronous function, remember, here we need to provide the callback url which the queue worker will inform, which will be our webhook service:

```
$ curl -i -H "X-Callback-Url: http://webhook-service.default.svc.cluster.local:5000" http://openfaas.localdns.xyz/async-async-function/function-async-task -d "asyyyyync"
HTTP/1.1 202 Accepted
Content-Length: 0
Date: Mon, 17 Feb 2020 13:57:26 GMT
Vary: Accept-Encoding
X-Call-Id: d757c10f-4293-4daa-bf52-bbdc17b7dea3
X-Start-Time: 1581947846737501600
```

Check the logs of the webhook pod:

```
$ kubectl logs -f pod/$(kubectl get pods --selector=app=webhook --output=jsonpath="{.items..metadata.name}")
[2020-02-17 13:57:26,774] INFO in app: Receveid Event: {'event': b'asyyyyync'}
[2020-02-17 13:57:26,775] INFO in internal: 10.42.0.6 - - [17/Feb/2020 13:57:26] "POST / HTTP/1.1" 200 -
```

Check the logs of the queue worker:

```
$ kubectl logs -f deployment/queue-worker -n openfaas
[45] Received on [faas-request]: 'sequence:45 subject:"faas-request" data:"{\"Header\":{\"Accept\":[\"*/*\"],\"Accept-Encoding\":[\"gzip\"],\"Content-Length\":[\"9\"],\"Content-Type\":[\"application/x-www-form-urlencoded\"],\"User-Agent\":[\"curl/7.54.0\"],\"X-Call-Id\":[\"d757c10f-4293-4daa-bf52-bbdc17b7dea3\"],\"X-Callback-Url\":[\"http://webhook-service.default.svc.cluster.local:5000\"],\"X-Forwarded-For\":[\"10.42.0.0\"],\"X-Forwarded-Host\":[\"openfaas.localdns.xyz\"],\"X-Forwarded-Port\":[\"80\"],\"X-Forwarded-Proto\":[\"http\"],\"X-Forwarded-Server\":[\"traefik-6787cddb4b-87zss\"],\"X-Real-Ip\":[\"10.42.0.0\"],\"X-Start-Time\":[\"1581947846737501600\"]},\"Host\":\"openfaas.localdns.xyz\",\"Body\":\"YXN5eXl5eW5j\",\"Method\":\"POST\",\"Path\":\"\",\"QueryString\":\"\",\"Function\":\"openfaas-function-cat\",\"CallbackUrl\":{\"Scheme\":\"http\",\"Opaque\":\"\",\"User\":null,\"Host\":\"webhook-service.default.svc.cluster.local:5000\",\"Path\":\"\",\"RawPath\":\"\",\"ForceQuery\":false,\"RawQuery\":\"\",\"Fragment\":\"\"}}" timestamp:1581947846738308800 '
Invoking: openfaas-function-cat with 9 bytes, via: http://gateway.openfaas.svc.cluster.local:8080/function/openfaas-function-cat/
Invoked: openfaas-function-cat [200] in 0.029029s
Callback to: http://webhook-service.default.svc.cluster.local:5000
openfaas-function-cat returned 9 bytes
Posted result for openfaas-function-cat to callback-url: http://webhook-service.default.svc.cluster.local:5000, status: 200
```

Make 1000 Requests:

```
$ date > time.date 
  for x in {1..1000}
    do 
      curl -i -H "X-Callback-Url: http://webhook-service.default.svc.cluster.local:5000" http://openfaas.localdns.xyz/async-function/openfaas-function-cat -d "asyyyyync"
    done
  date >> time.date
```

View the log file that we wrote before we started and finished our requests:

```
$ cat time.date
Mon Feb 17 16:03:16 SAST 2020
Mon Feb 17 16:03:48 SAST 2020
```

The last request was actioned at:

```
[2020-02-17 14:03:52,421] INFO in internal: 10.42.0.6 - - [17/Feb/2020 14:03:52] "POST / HTTP/1.1" 200 -
```

## Thank You

This was a basic example to demonstrate async functions using OpenFaas

## OpenFaas Documentation:

- https://docs.openfaas.com
- https://docs.openfaas.com/reference/async/
