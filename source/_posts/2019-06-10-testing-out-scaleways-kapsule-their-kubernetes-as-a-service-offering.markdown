---
layout: post
title: "Testing out Scaleways Kapsule their Kubernetes as a Service offering"
date: 2019-06-10 12:28:45 -0400
comments: true
categories: ["kubernetes", "scaleway", "kapsule"] 
---

![](https://user-images.githubusercontent.com/567298/59177864-a5b78d00-8b5d-11e9-931c-5b5dd4e81805.png)

At this time of writing (2019.06.10) Scaleway's Kubernetes as a Service, named Kapsule is in Private Beta and got access and pretty stoked on how easy it is to provision a Kubernetes cluster.

## What are we doing today?

In this tutorial I will show you how easy it is to provision a 3 node Kubernetes Cluster on Scaleway. In the upcoming tutorial, I will create traefik as an ingress controller and deploy applications to our cluster. [Github Repo Version available for now](https://github.com/ruanbekker/traefik-kubernetes-scaleway-demo)

## Provision a Kapsule Cluster

Head over to Kapsule and provision a Kubernetes Cluster:

![](https://user-images.githubusercontent.com/567298/59164353-e71f4c80-8b0b-11e9-8f5c-7c65db1af7b2.png)

At this point in time, I will only create a one node "cluster", as I want to show how to add pools after the intial creation.

After the cluster has been provisioned, you will get information about your endpoints from the Cluster Infromation Section, which we will need for our ingresses:

![](https://user-images.githubusercontent.com/567298/59180685-df8c9180-8b65-11e9-82aa-05ee3cd42c78.png)

Scroll down to download your config:

![](https://user-images.githubusercontent.com/567298/59164356-f56d6880-8b0b-11e9-8c00-34dff0ba61fb.png)

Move your config in place:

```
$ mv ~/Downloads/kubeconfig-k8s-mystifying-torvalds.yaml ~/.kube/config
```

## Interact with your Cluster

Test the connection by getting the info of your nodes in your kubernetes cluster:

```
$ kubectl get node
NAME                                             STATUS    ROLES     AGE       VERSION
scw-k8s-mystifying-torvalds-default-7f263aabab   Ready     <none>    4m        v1.14.1
```

## Add more nodes:

Provision another pool with 2 more nodes in our cluster:

![](https://user-images.githubusercontent.com/567298/59164387-4e3d0100-8b0c-11e9-8633-b3fc680ac4cd.png)

After the pool has been provisioned, verified that they have joined the cluster:

```
$ kubectl get nodes
NAME                                             STATUS    ROLES     AGE       VERSION
scw-k8s-mystifying-torvald-jovial-mclar-25a942   Ready     <none>    2m        v1.14.1
scw-k8s-mystifying-torvald-jovial-mclar-eaf1a2   Ready     <none>    2m        v1.14.1
scw-k8s-mystifying-torvalds-default-7f263aabab   Ready     <none>    15m       v1.14.1
```

## Label the nodes

Apply node role capabilities by labelling the nodes to one master and two nodes:

```
$ kubectl label node scw-k8s-mystifying-torvalds-default-7f263aabab node-role.kubernetes.io/master=""
node "scw-k8s-mystifying-torvalds-default-7f263aabab" labeled

$ kubectl label node scw-k8s-mystifying-torvald-jovial-mclar-eaf1a2 node-role.kubernetes.io/node=""
node "scw-k8s-mystifying-torvald-jovial-mclar-eaf1a2" labeled

$ kubectl label node scw-k8s-mystifying-torvald-jovial-mclar-25a942 node-role.kubernetes.io/node=""
node "scw-k8s-mystifying-torvald-jovial-mclar-25a942" labeled
```

Now when we inspect the nodes, they will be labeled:

```
$ kubectl get nodes
NAME                                             STATUS    ROLES     AGE       VERSION
scw-k8s-mystifying-torvald-jovial-mclar-25a942   Ready     node      5m        v1.14.1
scw-k8s-mystifying-torvald-jovial-mclar-eaf1a2   Ready     node      5m        v1.14.1
scw-k8s-mystifying-torvalds-default-7f263aabab   Ready     master    17m       v1.14.1
```

Simplicity at its best, well done to Scaleway.
