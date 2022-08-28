---
layout: post
title: "Traefik Ingress for OpenFaas on Kubernetes (k3d)"
date: 2020-02-17 23:36:33 +0200
comments: true
categories: ["kubernetes", "k3d", "traefik", "openfaas"] 
---

In this post we will deploy [OpenFaas](https://www.openfaas.com/) on Kubernetes locally using [k3sup](https://github.com/alexellis/k3sup) and [k3d](https://github.com/rancher/k3d), then deploy a Traefik Ingress so that we can access the OpenFaas Gateway on HTTP over the standard port 80.

K3d is a amazing wrapper that deploys a k3s cluster on docker, and k3sup makes it very easy to provision OpenFaas to your Kubernetes cluster.

## Deploy a Kubernetes Cluster

If you have not installed k3d, you can install k3d on mac with brew:

```
$ brew install k3d
```

We will deploy our cluster with 2 worker nodes and publish port 80 to the containers port 80:

```
$ k3d create --name="demo" --workers="2" --publish="80:80"
```

Point the kubeconfig to the location that k3d generated:

```
$ export KUBECONFIG="$(k3d get-kubeconfig --name='demo')"
```

## Deploy OpenFaas

First we need to get k3sup:

```
$ curl -sLfS https://get.k3sup.dev | sudo sh
```

Once k3sup is installed, deploy OpenFaas to your cluster:

```
$ k3sup app install openfaas
```

Give it a minute or so and check if everything is running:

```
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

## Traefik Ingress

In my scenario, I am using `openfaas.localdns.xyz` which resolves to `127.0.0.1`. Next we need to know to which service to route the traffic to, we can find that by:

```
$ kubectl get svc/gateway -n openfaas
NAME      TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
gateway   ClusterIP   10.43.174.57   <none>        8080/TCP   23m
```

Below is our ingress.yml:

```
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: openfaas-gateway-ingress
  namespace: openfaas
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: openfaas.localdns.xyz
    http:
      paths:
      - backend:
          serviceName: gateway
          servicePort: 8080
```

Apply the ingress:

```
$ kubectl apply -f ingress.yml
ingress.extensions/openfaas-gateway-ingress created
```

We can the verify that our ingress is visible:

```
$ kubectl get ingress -n openfaas
NAMESPACE   NAME                       HOSTS               ADDRESS      PORTS   AGE
openfaas    openfaas-gateway-ingress   openfaas.co.local   172.25.0.4   80      28s
```

## OpenFaas CLI

Install the OpenFaas CLI:

```
$ curl -SLsf https://cli.openfaas.com | sudo sh
```

Export the `OPENFAAS_URL` to our ingress endpoint and `OPENFAAS_PREFIX` for your dockerhub username:

```
$ export OPENFAAS_URL=http://openfaas.localdns.xyz
$ export OPENFAAS_PREFIX=ruanbekker # change to your username
```

Get your credentials for the OpenFaas Gateway and login with the OpenFaas CLI:

```
$ PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)
$ echo -n $PASSWORD | faas-cli login --username admin --password-stdin
```

## Deploy a Function

Deploy the figlet function as an example:

```
$ faas-cli store deploy figlet

Deployed. 202 Accepted.
URL: http://openfaas.localdns.xyz/function/figlet
```

Invoke the function:

```
$ curl http://openfaas.localdns.xyz/function/figlet -d 'hello, world'
 _          _ _                             _     _
| |__   ___| | | ___    __      _____  _ __| | __| |
| '_ \ / _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` |
| | | |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |
|_| |_|\___|_|_|\___( )   \_/\_/ \___/|_|  |_|\__,_|
                    |/
```

## Delete the Cluster

Delete your k3d Kubernetes Cluster:

```
$ k3d delete --name demo
```

## Thank You
