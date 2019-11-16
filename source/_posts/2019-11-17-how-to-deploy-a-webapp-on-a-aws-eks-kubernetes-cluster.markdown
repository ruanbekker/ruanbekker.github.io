---
layout: post
title: "How To Deploy a Webapp on a AWS EKS Kubernetes Cluster"
date: 2019-11-17 00:21:19 +0200
comments: true
categories: ["aws", "eks", "kubernetes", "docker"] 
---

![kubernetes-eks-deploy-webapp](https://user-images.githubusercontent.com/567298/68999897-f59a3d00-08cf-11ea-83c7-8624e6048106.png)

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

In our previous post, [Part 1 - Setup a EKS Cluster](https://blog.ruanbekker.com/blog/2019/11/16/how-to-setup-a-aws-eks-kubernetes-cluster/) we went through the steps on how to Setup a EKS Cluster.

## What are we doing today

In this post, we will deploy a sample web application to EKS and access our application using a ELB that EKS provides us.

## Deployment Manifests

We will have two manifests that we will deploy to Kubernetes, a deployment manifest that will hold the information about our application and a service manifest that will hold the information about the service load balancer.

The deployment manifest, you will notice that we are specifying that we want 3 containers, we are using labels so that our service and deployment can find each other and we are using a basic http web application that will listen on port 8000 inside the container:

```bash
$ cat deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-hostname-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app-container
          image: ruanbekker/hostname
          ports:
          - name: http
            containerPort: 8000
```

The service manifest, you will notice that we are specifying `type: LoadBalancer` in our service manifest, this will tell EKS to provision a ELB for your application so that we can access our application from the internet.

You will see that the selector is specifying `my-app` which we also provided in our deployment.yml so that our service know where to find our backend application. We are also stating that the service is listening on port 80, and will forward its traffic to our deployment on port 8000:

```bash
$ cat service.yml
apiVersion: v1
kind: Service
metadata:
  name: my-hostname-app-service
  labels:
    app: my-app
spec:
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: my-app
  type: LoadBalancer
```

## Deployment Time

Deploy our application:

```bash
$ kubectl apply -f deployment.yml
deployment.apps/my-hostname-app created
```

Deploy our service:

```bash
$ kubectl apply -f service.yml
service/my-hostname-app-service created
```

Now when we look at our deployment, we should see that 3 replicas of our application is running:

```bash
$ kubectl get deployments
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
my-hostname-app   3/3     3            3           4m38s
```

To see the pods of that deployment, look at the pods:

```bash
$ kubectl get pods
NAME                               READY   STATUS    RESTARTS   AGE
my-hostname-app-5dcd48dfc5-2j8zm   1/1     Running   0          24s
my-hostname-app-5dcd48dfc5-58vkc   1/1     Running   0          24s
my-hostname-app-5dcd48dfc5-cmjwj   1/1     Running   0          24s
```

As we have more than one service in our EKS cluster, we can specify the labels that we have applied on our manifests to filter what we want to see (`app: my-app`):

```bash
$ kubectl get service --selector app=my-app
NAME                      TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)        AGE
my-hostname-app-service   LoadBalancer   10.100.114.166   a460661ce089b11ea97cd06dd7513db6-669054126.eu-west-1.elb.amazonaws.com   80:30648/TCP   2m29s
```

As we can see EKS provisioned a ELB for us, and we can access the application by making a HTTP request:

```bash
$ curl -i http://a460661ce089b11ea97cd06dd7513db6-669054126.eu-west-1.elb.amazonaws.com
HTTP/1.1 200 OK
Date: Sat, 16 Nov 2019 18:05:27 GMT
Content-Length: 43
Content-Type: text/plain; charset=utf-8

Hostname: my-hostname-app-5dcd48dfc5-2j8zm
```

## Scaling our Deployment

Let's scale our deployment to 5 replicas:

```bash
$ kubectl scale deployment/my-hostname-app --replicas 5
deployment.extensions/my-hostname-app scaled
```

After all the pods has been deployed, you should be able to see the 5 out of 5 pods that we provisioned, should be running:

```bash
$ kubectl get deployments
NAME              READY   UP-TO-DATE   AVAILABLE   AGE
my-hostname-app   5/5     5            5           5m7s
```

We can then also see the pods that our deployment is referencing:

```bash
$ kubectl get pods
NAME                               READY   STATUS    RESTARTS   AGE
my-hostname-app-5dcd48dfc5-2j8zm   1/1     Running   0          6m8s
my-hostname-app-5dcd48dfc5-58vkc   1/1     Running   0          6m8s
my-hostname-app-5dcd48dfc5-cmjwj   1/1     Running   0          6m8s
my-hostname-app-5dcd48dfc5-m4xcq   1/1     Running   0          67s
my-hostname-app-5dcd48dfc5-zf6xl   1/1     Running   0          68s
```

## Further Reading on Kubernetes

This is one amazing resource that covers a lot of kubernetes topics and will help you throughout your EKS journey:

- [EKSWorkshop](https://eksworkshop.com/introduction/)
- [Worker Nodes Documentation](https://docs.aws.amazon.com/eks/latest/userguide/worker.html)
- [Guestbook Kubernetes Sample Application](https://docs.aws.amazon.com/eks/latest/userguide/eks-guestbook.html)

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>

