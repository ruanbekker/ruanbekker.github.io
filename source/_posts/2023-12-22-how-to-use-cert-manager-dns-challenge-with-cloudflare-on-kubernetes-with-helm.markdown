---
layout: post
title: "How to use Cert-Manager DNS Challenge with Cloudflare on Kubernetes with Helm"
date: 2023-12-22 08:04:02 -0500
comments: true
categories: ["kubernetes", "cloudflare", "cert-manager", "devops"] 
---

In this tutorial, we will be issuing [Let's Encrypt](https://letsencrypt.org/docs/challenge-types/) certificates using [cert-manager](https://cert-manager.io/docs/) on [Kubernetes](https://kubernetes.io/) and we will be using the [DNS Challenge](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge) with [Cloudflare](https://www.cloudflare.com/en-gb/).

The reason I am using DNS Challenge instead of HTTP Challenge is because the Kubernetes environment is local on my laptop and there isn't a direct HTTP route into my environment from the internet and I would like to not expose the endpoints to the public internet.

## Summary of what we will be doing

We would like to have Let's Encrypt Certificates on our web application that will be issued by Cert-Manager using the DNS Challenge from CloudFlare.

Our ingress controller will be ingress-nginx and our endpoints will be private, as they will resolve to private IP addresses, hence the reason why we are using DNS validation instead of HTTP.

## Pre-Requisites

To follow along in this tutorial you will need the following

* [https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/](https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/)
    
* [Helm](https://helm.sh/docs/intro/install/)
    
* [Kubectl](https://kubernetes.io/docs/tasks/tools/)
    
* [Cloudflare](https://www.cloudflare.com/en-gb/) Account
    
* Patience (just kidding, I will try my best to make it easy)
    

## Install a Kubernetes Cluster

If you already have a Kubernetes Cluster, you can skip this step.

Define the `kind-config.yaml`

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
```

Then create the cluster with `kind`:

```bash
kind create cluster --name example --config kind-config.yaml
```

## Nginx Ingress Controller

First we need to install a ingress controller and I am opting in to use ingress-nginx, so first we need to add the helm repository to our local repositories:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```

Then we need to update our repositories:

```bash
helm repo update
```

Then we can install the helm release:

```bash
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.kind=DaemonSet \
  --set controller.hostPort.enabled=true \
  --set controller.ingressClass=nginx
```

You can view all the default values from their GitHub repository where the chart is hosted:

* [**https://github.com/kubernetes/ingress-nginx/blob/main/charts/ingress-nginx/values.yaml**](https://github.com/kubernetes/ingress-nginx/blob/main/charts/ingress-nginx/values.yaml)
    

Once the release has been deployed, you should see the ingress-nginx pod running under the `ingress-nginx` namespace:

```bash
kubectl get pods -n ingress-nginx
```

## Cert-Manager

The next step is to install cert-manager using helm, first add the repository:

```bash
helm repo add jetstack https://charts.jetstack.io
```

Update the repositories:

```bash
helm repo update
```

Then install the cert-manager release:

```bash
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.1 \
  --set installCRDs=true
```

## Cloudflare API Token

We need to grant Cert-Manager access to make DNS changes on our Cloudflare account for DNS validation on our behalf, and in order to do that, we need to create a Cloudflare API Token.

As per the [cert-manager documentation](https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/#api-tokens), from your profile select [API Tokens](https://dash.cloudflare.com/profile/api-tokens), create an API Token and select `Edit Zone DNS` template.

Then select the following:

* Permissions:
    
    * Zone: DNS -&gt; Edit
        
    * Zone: Zone -&gt; Read
        
* Zone Resources:
    
    * Include -&gt; All Zones
        

![](https://gitlab.com/bekker-space/workshops/ingress-nginx/uploads/c19d741352f767a1bfb97ef4fd716364/image.png align="left")

Then create the token and save the value somewhere safe, as we will be using it in the next step.

## Cert-Manager ClusterIssuer

First, we need to create a Kubernetes secret with the API Token that we created in the previous step.

```bash
kubectl create secret generic cloudflare-api-key-secret \
  --from-literal=api-key=[YOUR_CLOUDFLARE_API_KEY]
```

Then create the `clusterissuer.yaml`

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-dns01-issuer
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: you@example.com  # your email address for updates
    privateKeySecretRef:
      name: letsencrypt-dns01-private-key
    solvers:
    - dns01:
        cloudflare:
          email: you@example.com # your cloudflare account email address
          apiTokenSecretRef:
            name: cloudflare-api-key-secret
            key: api-key
```

Then create the cluster issuer:

```bash
kubectl apply -f clusterissuer.yaml
```

## Request a Certificate

Now that we have our `ClusterIssuer` created, we can request a certificate. In my scenario, I have a domain `example.com` which is hosted on CloudFlare and I would like to create a wildcard certificate on the sub-domain `*.workshop.example.com`

Certificates are scoped on a namespace level, and ClusterIssuer's are cluster-wide, therefore I am prefixing my certificate with the namespace (just my personal preference).

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: default-workshop-certificate
  namespace: default
spec:
  secretName: default-workshop-example-tls
  issuerRef:
    name: letsencrypt-dns01-issuer
    kind: ClusterIssuer
  commonName: workshop.example.com
  dnsNames:
  - workshop.example.com
  - '*.workshop.example.com'
```

Before we create the certificate on CloudFlare, I have created private DNS to the names mentioned in the manifest above like the following:

```bash
- workshop.example.com -> A Record -> 10.5.24.254
- *.workshop.example.com -> CNAME -> workshop.example.com
```

In the DNS configuration mentioned above, to explain why I am creating 2 entries:

* `10.2.24.254` - This is my LoadBalancer IP Address
    
* I have a static DNS entry to the name `workshop.example.com` so if my LoadBalancer IP Address ever change, I can just change this address
    
* I am creating a wildcard DNS entry for `*.workshop.example.com` and I am creating a CNAME record for it to resolve to `workshop.example.com` so it will essentially respond to the LoadBalancer IP.
    
* So lets say I create `test1.workshop.example.com` and `test2.workshop.example.com` then it will resolve to the LoadBalancer IP in `workshop.example.com` and as mentioned before, if the LoadBalancer IP ever changes, I only have to update the A Record of `workshop.example.com`
    

Then after DNS was created, I went ahead and created the certificate:

```bash
kubectl apply -f certificate.yaml
```

You can view the progress by viewing the certificate status by running:

```bash
kubectl get certificate -n default
```

## Specify the Certificate in your Ingress

Let's deploy a `nginx` web server deployment and I have concatenated the following in one manifest called `deployment.yaml`:

* `Deployment`
    
* `Service`
    
* `Ingress`
    

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-web
  namespace: default
  labels:
    app: nginx-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-web
  template:
    metadata:
      labels:
        app: nginx-web
    spec:
      containers:
      - name: nginx
        image: nginx:1.19
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-web-service
  namespace: default
  labels:
    app: nginx-web
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: nginx-web
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-web-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: nginx.workshop.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-web-service
            port:
              number: 80
  tls:
  - hosts:
    - nginx.workshop.example.com
    secretName: default-workshop-example-tls
```

A few important things to notice on the ingress resource:

* `host` the host needs to match the certificate
    
* `secretName` the secret needs to match the secret defined in the certificate
    

Then create the deployment:

```bash
kubectl apply -f deployment.yaml
```

## Ensure DNS Challenges are successful

Ensure that cert-manager can set DNS-01 challenge records correctly, if you encounter issues, you can inspect the cert-manager pod logs.

To view the pods for cert-manager:

```bash
kubectl get pods -n cert-manager
```

Then view the logs using:

```bash
kubectl logs -f pod <pod-id> -n cert-manager
```

## Test

You can open up a browser and access the ingress on your browser, in my case it would be `https://nginx.workshop.example.com` and verify that you have a certificate issued from Lets Encrypt.

## Thank You

Thanks for reading, if you enjoy my content please feel free to follow me on [**Twitter -**](https://twitter.com/ruanbekker) @[@ruanbekker](@ruanbekker) or visit me on my [**website -**](https://ruan.dev/) [**ruan.dev**](http://ruan.dev)
