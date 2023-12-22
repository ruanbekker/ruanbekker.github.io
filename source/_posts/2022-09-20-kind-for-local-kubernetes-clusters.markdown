---
layout: post
title: "KinD for Local Kubernetes Clusters"
date: 2022-09-20 02:18:16 -0400
comments: true
description: "Step by step guide to demonstrate how to setup a local kubernetes cluster with KinD, and it's amazing"
categories: ["kubernetes", "kind", "docker"]
---

![kubernetes-kind](https://user-images.githubusercontent.com/567298/191189852-44f2fd39-7ad7-4d0a-a36b-c2889a838649.png)

In this tutorial we will demonstrate how to use KinD (Kubernetes in Docker) to provision local kubernetes clusters for local development.

*Updated at*: _2023-12-22_

## About

KinD uses container images to run as "nodes", so spinning up and tearing down clusters becomes really easy or running multiple or different versions, is as easy as pointing to a different container image. 

Configuration such as node count, ports, volumes, image versions can either be controlled via the command line or via configuration, more information on that can be found on their documentation:

- https://kind.sigs.k8s.io/docs/user/quick-start/
- https://kind.sigs.k8s.io/docs/user/configuration/ 

## Installation

Follow the [docs](https://kind.sigs.k8s.io/docs/user/quick-start/#installing-with-a-package-manager) for more information, but for mac:

```bash
brew install kind
```

To verify if kind was installed, you can run:

```bash
kind version
```

## Create a Cluster

Create the cluster with command line arguments, such as cluster name, the container image:

```bash
kind create cluster --name cluster-1 --image kindest/node:v1.26.6
```

And the output will look something like this:

```bash
Creating cluster "cluster-1" ...
 ✓ Ensuring node image (kindest/node:v1.26.6) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-cluster-1"
You can now use your cluster with:

kubectl cluster-info --context kind-cluster-1

Have a question, bug, or feature request? Let us know! https://kind.sigs.k8s.io/#community 🙂
```

Then you can interact with the cluster using:

```bash
kubectl get nodes --context kind-cluster-1
```

Then delete the cluster using:

```bash
kind delete cluster --name kind-cluster-1
```

I **highly recommend** installing [kubectx](https://github.com/ahmetb/kubectx), which makes it easy to switch between kubernetes contexts.

## Create a Cluster with Config

If you would like to define your cluster configuration as config, you can create a file `default-config.yaml` with the following as a 2 node cluster, and specifying version 1.24.0:

```yaml
---
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  image: kindest/node:v1.26.6@sha256:6e2d8b28a5b601defe327b98bd1c2d1930b49e5d8c512e1895099e4504007adb
- role: worker
  image: kindest/node:v1.26.6@sha256:6e2d8b28a5b601defe327b98bd1c2d1930b49e5d8c512e1895099e4504007adb
```

Then create the cluster and point the config:

```bash
kind create cluster --name kind-cluster --config default-config.yaml
```

## Interact with the Cluster

View the cluster info:

```bash
kubectl cluster-info --context kind-kind-cluster
```

View cluster contexts:

```bash
kubectl config get-contexts
```

Use context:

```bash
kubectl config use-context kind-kind-cluster
```

View nodes:

```bash
kubectl get nodes -o wide

NAME                         STATUS   ROLES           AGE     VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE       KERNEL-VERSION      CONTAINER-RUNTIME
kind-cluster-control-plane   Ready    control-plane   2m11s   v1.26.6   172.20.0.5    <none>        Ubuntu 21.10   5.10.104-linuxkit   containerd://1.6.4
kind-cluster-worker          Ready    <none>          108s    v1.26.6   172.20.0.4    <none>        Ubuntu 21.10   5.10.104-linuxkit   containerd://1.6.4
```

## Deploy Sample Application

We will create a deployment, a service and port-forward to our service to access our application. You can also specify port configuration to your cluster so that you don't need to port-forward, which you can find in their [port mappings documentation](https://kind.sigs.k8s.io/docs/user/configuration/#extra-port-mappings)

I will be using the following commands to generate the manifests, but will also add them to this post:

```bash
kubectl create deployment hostname --namespace default --replicas 2 --image ruanbekker/containers:hostname --port 8080 --dry-run=client -o yaml > hostname-deployment.yaml
kubectl expose deployment hostname --namespace default --port=80 --target-port=8080 --name=hostname-http --dry-run=client -o yaml > hostname-service.yaml
```

The manifest:

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: hostname
  name: hostname
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hostname
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: hostname
    spec:
      containers:
      - image: ruanbekker/containers:hostname
        name: containers
        ports:
        - containerPort: 8080
        resources: {}
status: {}
---
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: hostname
  name: hostname-http
  namespace: default
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 8080
  selector:
    app: hostname
status:
  loadBalancer: {}
```

Then apply them with:

```bash
kubectl apply -f <name-of-manifest>.yaml
```

Or if you used kubectl to create them:

```bash
kubectl apply -f hostname-deployment.yaml
kubectl apply -f hostname-service.yaml
```

You can then view your resources with:

```bash
kubectl get deployment,pod,service

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hostname   2/2     2            2           9m27s

NAME                            READY   STATUS    RESTARTS   AGE
pod/hostname-7ff58c5644-67vhq   1/1     Running   0          9m27s
pod/hostname-7ff58c5644-wjjbw   1/1     Running   0          9m27s

NAME                    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/hostname-http   ClusterIP   10.96.218.58   <none>        80/TCP    5m48s
service/kubernetes      ClusterIP   10.96.0.1      <none>        443/TCP   24m
```

Port forward to your service:

```bash
kubectl port-forward svc/hostname-http 8080:80
```

Then access your application:

```bash
curl http://localhost:8080/

Hostname: hostname-7ff58c5644-wjjbw
```

## Delete Kind Cluster

View the clusters:

```bash
kind get clusters
```

Delete a cluster:

```bash
kind delete cluster --name kind-cluster
```

## Additional Configs

If you want more configuration options, you can look at their documentation:

- https://kind.sigs.k8s.io/docs/user/configuration/

But one more example that I like using, is to define the port mappings:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  image: kindest/node:v1.26.6@sha256:6e2d8b28a5b601defe327b98bd1c2d1930b49e5d8c512e1895099e4504007adb
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

## Extras

I highly recommend using `kubectx` to switch contexts and `kubens` to set the default namespace, and aliases:

```bash
alias k=kubectl
alias kx=kubectx
alias kns=kubens
```

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

