---
layout: post
title: "Install OpenFaas on k3d Kubernetes"
date: 2020-02-12 00:57:47 +0200
comments: true
categories: ["openfaas", "kubernetes", "k3d"] 
---

In this post we will deploy i[openfaas](https://www.openfaas.com) on kubernetes ([k3d](https://github.com/rancher/k3d))

## Kubernetes on k3d

k3d is a helper tool that provisions a kubernetes distribution, called k3s on docker. To deploy a kubernetes cluster on k3d, you can follow [this blog post](https://blog.ruanbekker.com/blog/2020/02/12/lightweight-development-kubernetes-options-k3d/)

## Deploy a 3 Node Kubernetes Cluster

Using k3d, let's deploy a kubernetes cluster:

```bash
$ k3d create --name="demo" --workers="2" --publish="80:80"
```

Export the kubeconfig:

```bash
$ export KUBECONFIG="$(k3d get-kubeconfig --name='demo')"
```

Verify that you are able to communicate with your kubernetes cluster:

```bash
$ kubectl get nodes
```

## Deploy OpenFaas

First we need to get [k3sup](https://k3sup.dev) :

```bash
$ curl -sLfS https://get.k3sup.dev | sudo sh
```

Once k3sup is installed, deploy openfaas to your cluster:

```bash
$ k3sup app install openfaas
```

Give it a minute or so and check if everything is running:

```bash
$ kubectl get pods -n openfaas
NAMESPACE     NAME                                 READY   STATUS      RESTARTS   AGE
openfaas      alertmanager-546f66b6c6-qtb69        1/1     Running     0          5m
openfaas      basic-auth-plugin-79b9878b7b-7vlln   1/1     Running     0          4m59s
openfaas      faas-idler-db8cd9c7d-8xfpp           1/1     Running     2          4m57s
openfaas      gateway-7dcc6d694d-dmvqn             2/2     Running     0          4m56s
openfaas      nats-d6d574749-rt9vw                 1/1     Running     0          4m56s
openfaas      prometheus-d99669d9b-mfxc8           1/1     Running     0          4m53s
openfaas      queue-worker-75f44b56b9-mhhbv        1/1     Running     0          4m52s
```

Install the openfaas-cli:

```bash
$ curl -SLsf https://cli.openfaas.com | sudo sh
```

In a screen session, forward port 8080 to the gateway service:

```bash
$ screen -S portfwd-process -m -d sh -c "kubectl port-forward -n openfaas svc/gateway 8080:8080"
```

Expose the gateway password as an environment variable:

```bash
$ PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
```

Then login to the gateway:

```bash
$ echo -n $PASSWORD | faas-cli login --username admin --password-stdin
```

## Deploy a OpenFaas Function

To list all the functions:

```bash
$ faas-cli store list
```

To deploy the figlet function:

```bash
$ faas-cli store deploy figlet

Deployed. 202 Accepted.
URL: http://127.0.0.1:8080/function/figlet
```

List your deployed functions:

```bash
$ faas-cli list
Function                      	Invocations    	Replicas
figlet                        	0              	1
```

Invoke your function:

```bash
$ curl http://127.0.0.1:8080/function/figlet -d 'hello, world'
 _          _ _                             _     _
| |__   ___| | | ___    __      _____  _ __| | __| |
| '_ \ / _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` |
| | | |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |
|_| |_|\___|_|_|\___( )   \_/\_/ \___/|_|  |_|\__,_|
                    |/
```

## Delete your Cluster 

When you are done, delete your kubernetes cluster:

```bash
$ k3d delete --name demo
```

## Thank You

Thank you for reading. If you like my content, feel free to visit me at **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

[![](https://user-images.githubusercontent.com/567298/71188576-e2410f80-2289-11ea-8667-08f0c14ab7b5.png)](https://twitter.com/ruanbekker)

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A6423ZIQ)

