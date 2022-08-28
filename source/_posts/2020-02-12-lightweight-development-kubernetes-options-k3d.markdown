---
layout: post
title: "Lightweight Development Kubernetes Options: k3d"
date: 2020-02-12 00:27:00 +0200
comments: true
categories: ["kubernetes"] 
---

In this post we will cover a lightweight development kubernetes called, "[k3d](https://github.com/rancher/k3d)" which we will deploy on a mac.

## What is k3d

[k3d](https://github.com/rancher/k3d) is a binary that provisions a [k3s](https://github.com/rancher/k3s) kubernetes cluster on docker

## Pre-Requirements

You will require docker and we will be using brew to install k3d on a mac.

## Install k3d

Installing k3d is as easy as:

```bash
$ brew install k3d
```

Verify your installation:

```
$ k3d --version
k3d version v1.3.1
```

## Deploy a 3 Node Cluster

Using k3d, we will deploy a 3 node k3s cluster:

```bash
$ k3d create --name="demo" --workers="2" --publish="80:80"
```

This will deploy a master and 2 worker nodes and we will also publish our host port 80 to our container port 80 (k3s comes default with traefik)

Set your kubeconfig:

```bash
$ export KUBECONFIG="$(k3d get-kubeconfig --name='demo')"
```

Test it out by listing your nodes:

```bash
$ kubectl get nodes
NAME                STATUS   ROLES    AGE    VERSION
k3d-demo-server     Ready    master   102s   v1.14.6-k3s.1
k3d-demo-worker-0   Ready    worker   102s   v1.14.6-k3s.1
k3d-demo-worker-1   Ready    worker   102s   v1.14.6-k3s.1
```

That was easy right?

## Deploy a Sample App

We will deploy a simple golang web application that will return the container name upon a http request. We will also make use of the traefik ingress for demonstration.

Our deployment manifest that I will save as `app.yml`:

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: k3s-demo
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: k3d-demo
  template:
    metadata:
      labels:
        app: k3d-demo
    spec:
      containers:
      - name: k3d-demo
        image: ruanbekker/hostname:latest
---
apiVersion: v1
kind: Service
metadata:
  name: k3d-demo
  namespace: default
spec:
  ports:
  - name: http
    targetPort: 8000
    port: 80
  selector:
    app: k3d-demo
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: k3d-demo
  annotations:
    kubernetes.io/ingress.class: "traefik"

spec:
  rules:
  - host: k3d-demo.example.org
    http:
      paths:
      - path: /
        backend:
          serviceName: k3d-demo
          servicePort: http
```

Deploy our application:

```bash
$ kubectl apply -f app.yml
deployment.extensions/k3s-demo created
service/k3d-demo created
ingress.extensions/k3d-demo created
```

Verify that the pods are running:

```bash
$ kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
k3s-demo-f76d866b9-dv5z9   1/1     Running   0          10s
k3s-demo-f76d866b9-qxltk   1/1     Running   0          10s
```

Make a http request:

```bash
$ curl -H "Host: k3d-demo.example.org" http://localhost
Hostname: k3d-demo-f76d866b9-qxltk
```

## Deleting your Cluster

To delete your cluster:

```bash
$ k3d delete --name demo
```

## Thank You

Thank you for reading. If you like my content, feel free to visit me at **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

[![](https://user-images.githubusercontent.com/567298/71188576-e2410f80-2289-11ea-8667-08f0c14ab7b5.png)](https://twitter.com/ruanbekker)

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A6423ZIQ)
