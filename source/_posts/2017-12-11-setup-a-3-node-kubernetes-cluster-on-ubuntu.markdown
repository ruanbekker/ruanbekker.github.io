---
layout: post
title: "Setup a 3 Node Kubernetes Cluster on Ubuntu"
date: 2017-12-11 09:31:47 -0500
comments: true
categories: ["kubernetes", "openfaas", "ubuntu"] 
---

![](https://kumorilabs.com/img/blog/kubernetes-logo.png)

Setup a 3 Node Kubernetes Cluster on Ubuntu 16.04

## What is Kubernetes?

As referenced from their [website](https://kubernetes.io/):

- "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications."

## Our Setup:

For this setup I will be using 3 AWS EC2 Instances with Ubuntu 16.04. One node will act as the master node, and the other 2 nodes, will act as nodes, previously named minions.

We will deploy Kubernetes on all 3 nodes, the master will be the node where we will initialize our cluster, deploy our weave network, applications and we will execute the join command on the worker nodes to join the master to form the cluster.

## Deploy Kubernetes: Master

The following commands will be used to install Kubernetes, it will be executed with root permissions:

```bash
$ apt update && sudo apt upgrade -y
$ sudo apt install docker.io apt-transport-https -qy
$ sudo apt update
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
$ sudo su -c 'echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/app' root
$ apt update
$ sudo apt install kubelet kubeadm kubernetes-cni -y
```

Now we would like to set up the master by initializing the cluster:

```bash
$ sudo kubeadm init --kubernetes-version stable-1.8
```

The output will provide you with instructions to setup the configurations for the master node, and provide you with a join token for your worker nodes, remember to make not of this token string, as we will need it later for our worker nodes. As your normal user, run the following to setup the config:

Remember to not run this as root, and as the normal user:

```bash
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Now we need to deploy a network for our pods:

```bash
$ kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```

Lets confirm if all our resources are in its desired state, a small snippet of the output will look like the one below:

```bash
$ kubectl get all -n kube-system

...
NAME                                          READY     STATUS    RESTARTS   AGE
po/etcd-ip-172-31-40-211                      1/1       Running   0          6h
po/kube-apiserver-ip-172-31-40-211            1/1       Running   0          6h
```

Once all of the resources are in its desired state, we can head along to our worker nodes, to join them to the cluster

## Deploy Kubernetes: Worker Nodes

As I have 2 worker nodes, we will need to deploy the following on both of our worker nodes, first to deploy Kubernetes on our nodes with root permission:

```bash
$ apt update && sudo apt upgrade -y
$ sudo apt install docker.io apt-transport-https -qy
$ sudo apt update
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
$ sudo su -c 'echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/app' root
$ apt update
$ sudo apt install kubelet kubeadm kubernetes-cni -y
```

Once Kubernetes is installed, join the Master node by executing the join command:

```bash
$ sudo kubeadm join --token 49abf7.247d663db97f8504 172.31.40.211:6443 --discovery-token-ca-cert-hash sha256:3a3b301cfbac0995c69a0115989ea384230470d6836ae0e13e71dbdf15ffbb48
```

Do the 2 steps on the other node, then head back to the master node.

## Verifying if All Nodes are Checked In

To verify if all nodes are available and reachable in the cluster:

```bash
$ kubectl get nodes
NAME               STATUS    ROLES     AGE       VERSION
ip-172-31-36-68    Ready     <none>    6h        v1.8.5
ip-172-31-40-211   Ready     master    6h        v1.8.5
ip-172-31-44-80    Ready     <none>    6h        v1.8.5
```

## Deploy Services to Kubernetes:

Kubernetes has Awesome Examples on their [Github Repository](https://github.com/kubernetes/kubernetes/tree/master/examples).

Since the awesomeness of [OpenFaas](https://github.com/openfaas), I will deploy OpenFaas on Kubernetes:

```bash
$ git clone https://github.com/openfaas/faas-netes
$ cd faas-netes
$ kubectl apply -f faas.yml,monitoring.yml,rbac.yml
```

Give it about a minute or so, then you should see the pods running in their desired state:

```bash
$ kubectl get pods
NAME                           READY     STATUS    RESTARTS   AGE
alertmanager-77b4b476b-zxtcz   1/1       Running   0          4h
crypto-7d8b7f999c-7l85k        1/1       Running   0          1h
faas-netesd-64fb9b4dfb-hc8gh   1/1       Running   0          4h
gateway-69c9d949f-q57zh        1/1       Running   0          4h
prometheus-7fbfd8bfb8-d4cft    1/1       Running   0          4h
```

When we have the desired state, head over to the OpenFaas Gateway WebUI: `http://master-public-ip:31112/ui/`, select "Deploy New Function", you can use your own function or select one from the store.

I am going to use Figlet from the store, once the pod has been deployed, select the function, enter any text into the request body and select invoke. I have used my name and surname, and turns out into:

```bash
 ____                      ____       _    _             
|  _ \ _   _  __ _ _ __   | __ )  ___| | _| | _____ _ __ 
| |_) | | | |/ _` | '_ \  |  _ \ / _ \ |/ / |/ / _ \ '__|
|  _ <| |_| | (_| | | | | | |_) |  __/   <|   <  __/ |   
|_| \_\\__,_|\__,_|_| |_| |____/ \___|_|\_\_|\_\___|_|   
                                                         
```

## Resources:

- [Kubernetes Overview](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes Blogs](https://blog.alexellis.io/tag/kubernetes/)
- [OpenFaas Blogs](https://blog.alexellis.io/tag/openfaas/)

