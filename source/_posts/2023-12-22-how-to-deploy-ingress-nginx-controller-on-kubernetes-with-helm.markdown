---
layout: post
title: "How to deploy Ingress-Nginx Controller on Kubernetes with Helm"
date: 2023-12-22 07:56:22 -0500
comments: true
categories: ["kubernetes", "nginx", "devops"] 
dont_redirect: true
---

In this tutorial we will deploy the [ingress-nginx](https://github.com/kubernetes/ingress-nginx) controller on kubernetes.

## Pre-Requisites

I will be using kind to run a kubernetes cluster locally, if you want to follow along, have a look at my previous post on how to install [kubectl](https://kubernetes.io/docs/tasks/tools/) and kind and the basic usage of kind:

* [https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/](https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/)
    

You will also need [helm](https://helm.sh/docs/intro/install/) to deploy the ingress-nginx release from their helm charts, you can see their documentation on how to install it:

* [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)
    

## Create the Kubernetes Cluster

First we will define the kind configuration which will expose port 80 locally in a file name `kind-config.yaml`

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  image: kindest/node:v1.25.11@sha256:227fa11ce74ea76a0474eeefb84cb75d8dad1b08638371ecf0e86259b35be0c8
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
    listenAddress: "0.0.0.0"
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
```

Then go ahead and create the kubernetes cluster:

```bash
kind create cluster --name workshop --config kind-config.yaml
```

## Install ingress-nginx using Helm

Install the ingress-nginx helm chart, by first adding the repository:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```

Then update your local repositories:

```bash
helm repo update
```

Then install the helm release, and set a couple of overrides.

The reason we use NodePort is because our kubernetes cluster runs on docker containers, and from our kind config we have exposed port 80 locally, we are using the NodePort service so that we can make an HTTP request to port 80 to traverse to the port of the service:

```bash
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.kind=DaemonSet \
  --set controller.hostPort.enabled=true \
  --set controller.ingressClass=nginx
```

You can view all the default values from their GitHub repository where the chart is hosted:

* [https://github.com/kubernetes/ingress-nginx/blob/main/charts/ingress-nginx/values.yaml](https://github.com/kubernetes/ingress-nginx/blob/main/charts/ingress-nginx/values.yaml)
    

Once the release has been deployed, you should see the ingress-nginx pod running under the `ingress-nginx` namespace:

```bash
kubectl get pods -n ingress-nginx
```

## Deploy a Web Application

We will create 3 files:

* `example/deployment.yaml`
    
* `example/service.yaml`
    
* `example/ingress.yaml`
    

Create the example directory:

```bash
mkdir example
```

Our `example/deployment.yaml`

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: webapp
  name: webapp
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - image: ruanbekker/web-center-name-v2
        name: webapp
        ports:
        - name: http
          containerPort: 5000
        env:
        - name: APP_TITLE
          value: "Runs on Kind"
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "1000m"
```

Our `example/service.yaml`

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: webapp
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: webapp
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 5000
```

Our `example/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp
  namespace: default
spec:
  ingressClassName: nginx
  rules:
    - host: example.127.0.0.1.nip.io
      http:
        paths:
          - pathType: Prefix
            backend:
              service:
                name: webapp
                port:
                  number: 80
            path: /
```

In summary, we are creating a deployment with a pod that listens on port 5000, and then we are creating a service with port 80 that will forward its connections to the container port of 5000.

Then we define our ingress that will match our hostname and forward its connections to our service on port 80, and also notice that we are defining our ingress class name, which we have set in our helm values.

Deploy this example with kubectl:

```bash
kubectly apply -f example/
```

Now you can access the web application at [http://example.127.0.0.1.nip.io](http://example.127.0.0.1.nip.io)

## Teardown

You can delete the resources that we've created using:

```bash
kubectl delete -f example/
```

Delete the cluster using:

```bash
kind delete cluster --name workshop
```

## Thank You

Thanks for reading, if you enjoy my content please feel free to follow me on [**Twitter - @ruanbekker**](https://twitter.com/ruanbekker) or visit me on my [**website -**](https://ruan.dev/) [**ruan.dev**](http://ruan.dev)
