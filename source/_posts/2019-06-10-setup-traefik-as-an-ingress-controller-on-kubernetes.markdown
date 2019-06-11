---
layout: post
title: "Setup Traefik as an Ingress Controller on Kubernetes"
date: 2019-06-10 16:21:36 -0400
comments: true
categories: ["scaleway", "traefik", "kubernetes"] 
---

![image](https://user-images.githubusercontent.com/567298/59225379-db498e00-8bd0-11e9-9f20-62aecf915431.png)


If you have not provisioned a Kubernetes Cluster, you can [see this tutorial](https://blog.ruanbekker.com/blog/2019/06/10/testing-out-scaleways-kapsule-their-kubernetes-as-a-service-offering/) on how to provision a Kubernetes Cluster on Scaleway

## What will we be doing

In this tutorial we will setup Traefik as an Ingress Controller on Kubernetes and deploy a logos web app to our Kubernetes Cluster, using frontend rules to map subdomains to specific services. 

We will have 3 subdomains, being mapped to containers from the below docker images:

```
FQDN                     Image Name
- python.domain.com   -> ruanbekker/logos:python
- openfaas.domain.com -> ruanbekker/logos:openfaas
- rancher.domain.com  -> ruanbekker/logos:rancher
```

## Get the sources

If you would like to get the source code for this demonstration you can checkout this repository: [https://github.com/ruanbekker/traefik-kubernetes-scaleway-demo](https://github.com/ruanbekker/traefik-kubernetes-scaleway-demo)

```
$ git clone https://github.com/ruanbekker/traefik-kubernetes-scaleway-demo
$ cd traefik-kubernetes-scaleway-demo
```

## Provision Traefik as an Ingress Controller

Apply role based access control to authorize Traefik to use the Kubernetes API:

```
$ kubectl apply -f traefik/01-traefik-rbac.yaml
clusterrole.rbac.authorization.k8s.io/traefik-ingress-controller created
clusterrolebinding.rbac.authorization.k8s.io/traefik-ingress-controller created
```

Consulting [Traefik's](https://docs.traefik.io/user-guide/kubernetes/#deploy-traefik-using-a-deployment-or-daemonset) documentation, when deploying Traefik, it's possible to use a deployment or a demonset, not both. [More details on why](https://docs.traefik.io/user-guide/kubernetes/#deploy-traefik-using-a-deployment-or-daemonset)


I will go ahead and apply the Daemon Set:

```
$ kubectl apply -f traefik/03-traefik-ds.yaml
serviceaccount/traefik-ingress-controller created
daemonset.extensions/traefik-ingress-controller created
service/traefik-ingress-service created
```

The Traefik UI Service will be associated with a FQDN, remember to set the FQDN for the endpoint, as example:

```
$ cat traefik/04-traefik-ui.yaml
...
spec:
  rules:
  - host: traefik-ui.x-x-x-x-x.nodes.k8s.fr-par.scw.cloud
    http:
      paths:
      - path: /
...
```

Create the Traefik UI Service:

```
$ kubectl apply -f traefik/04-traefik-ui.yaml
service/traefik-web-ui created
```

Traefik UI Ingress:

```
$ kubectl apply -f traefik/05-traefik-ui-ingress.yaml
ingress.extensions/traefik-web-ui created
```

View the services:

```
$ kubectl get services --namespace=kube-system
NAME                      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                  AGE
coredns                   ClusterIP   x.x.x.x         <none>        53/UDP,53/TCP,9153/TCP   11h
heapster                  ClusterIP   x.x.x.x         <none>        80/TCP                   11h
kubernetes-dashboard      ClusterIP   x.x.x.x         <none>        443/TCP                  11h
metrics-server            ClusterIP   x.x.x.x         <none>        443/TCP                  11h
monitoring-influxdb       ClusterIP   x.x.x.x         <none>        8086/TCP                 11h
traefik-ingress-service   ClusterIP   x.x.x.x         <none>        80/TCP,8080/TCP          24m
traefik-web-ui            ClusterIP   x.x.x.x         <none>        80/TCP                   24m
```

## Deploy the Logo App to the Cluster

We will deploy the logo app to our cluster:

```
$ kubectl apply -f logos-app/logos-services.yaml
service/openfaas created
service/rancher created
service/python created
```

Create the deployment:

```
$ kubectl apply -f logos-app/logos-deployments.yaml
deployment.extensions/openfaas created
deployment.extensions/rancher created
deployment.extensions/python created
```

Before creating the ingress for the logo's applications, we need to set the fqdn endpoints that we want to route traffic to as below as an example:

```
$ cat logos-app/logos-ingress.yaml
...
spec:
  rules:
  - host: openfaas.x-x-x-x-x.nodes.k8s.fr-par.scw.cloud
    http:
      paths:
      - path: /
        backend:
          serviceName: openfaas
          servicePort: http
...
```

Create the ingress:

```
$ kubectl apply -f logos-app/logos-ingress.yaml
ingress.extensions/logo created
```

After some time, have a look at the pods to get the status:

```
$ kubectl get pods
NAME                                     READY   STATUS    RESTARTS   AGE
openfaas-cffdddc4-lvn5w                  1/1     Running   0          4m6s
openfaas-cffdddc4-wbcl6                  1/1     Running   0          4m6s
python-65ccf9c74b-8kmgp                  1/1     Running   0          4m6s
python-65ccf9c74b-dgnqb                  1/1     Running   0          4m6s
rancher-597b6b8554-mgcjr                 1/1     Running   0          4m6s
rancher-597b6b8554-mpk62                 1/1     Running   0          4m6s
```

## Navigating with Kubectl

Show nodes:

```
$ kubectl get nodes
NAME                                             STATUS   ROLES    AGE   VERSION
scw-k8s-mystifying-torvald-jovial-mclar-25a942   Ready    node     20h   v1.14.1
scw-k8s-mystifying-torvald-jovial-mclar-eaf1a2   Ready    node     20h   v1.14.1
scw-k8s-mystifying-torvalds-default-7f263aabab   Ready    master   20h   v1.14.1
```

Show services:

```
$ kubectl get services
NAME                    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)           AGE
kubernetes              ClusterIP   10.32.0.1      <none>        443/TCP           20h
openfaas                ClusterIP   10.41.47.185   <none>        80/TCP            9h
python                  ClusterIP   10.42.56.141   <none>        80/TCP            9h
rancher                 ClusterIP   10.32.41.218   <none>        80/TCP            9h
```

Show Pods:

*To see pods from the kube-system namespace add -n kube-system*

```
$ kubectl get pods
NAME                                     READY   STATUS    RESTARTS   AGE
openfaas-cffdddc4-lvn5w                  1/1     Running   0          9h
openfaas-cffdddc4-wbcl6                  1/1     Running   0          9h
python-65ccf9c74b-8kmgp                  1/1     Running   0          9h
python-65ccf9c74b-dgnqb                  1/1     Running   0          9h
rancher-597b6b8554-mgcjr                 1/1     Running   0          9h
rancher-597b6b8554-mpk62                 1/1     Running   0          9h
```

Show deployments:

```
$ kubectl get deployments -o wide
NAME                    READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS  IMAGES                      SELECTOR
openfaas                2/2     2            2           9h    logo        ruanbekker/logos:openfaas   app=logo,task=openfaas
python                  2/2     2            2           9h    logo        ruanbekker/logos:python     app=logo,task=python
rancher                 2/2     2            2           9h    logo        ruanbekker/logos:rancher    app=logo,task=rancher
```

Show ingress:

```
$ kubectl get ingress -o wide
NAME      HOSTS                                                          ADDRESS   PORTS   AGE
logo      openfaas.domain.com,rancher.domain.com,python.domain.com       80      9h
```

Show system ingress:

```
$ kubectl get ingress -o wide -n kube-system
NAME             HOSTS                     ADDRESS   PORTS   AGE
traefik-web-ui   traefik-ui.domain.com               80      9h
```

## Access your Applications

Access the Traefik-UI, and filter for one of the applications. Let's take OpenFaaS for an example:

![image](https://user-images.githubusercontent.com/567298/59177432-63418080-8b5c-11e9-8e54-20600508e510.png)

Access the OpenFaaS Page via the URL:

![image](https://user-images.githubusercontent.com/567298/59177206-a4856080-8b5b-11e9-8954-238590f18e5c.png)

## Resources

- https://docs.traefik.io/user-guide/kubernetes/

center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
