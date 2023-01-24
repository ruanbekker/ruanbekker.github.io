---
layout: post
title: "Everything you need to know about Helm"
date: 2023-01-24 16:02:22 -0500
comments: true
categories: ["kubernetes", "helm"] 
---

<img width="965" alt="image" src="https://user-images.githubusercontent.com/567298/214427983-29601304-9930-40b6-bbc6-e2ce68c04c23.png">

Helm, its one amazing piece of software that I use multiple times per day!

## What is Helm?

You can think of helm as a package manager for kubernetes, but in fact its much more than that. 

Think about it in the following way:

- Kubernetes Package Manager
- Way to templatize your applications (this is the part im super excited about)
- Easy way to install applications to your kubernetes cluster
- Easy way to do upgrades to your applications
- Websites such as artifacthub.io provides a nice interface to lookup any application an how to install or upgrade that application.

## How does Helm work?

Helm uses your kubernetes config to connect to your kubernetes cluster. In most cases it utilises the config defined by the `KUBECONFIG` environment variable, which in most cases points to `~/kube/config`. 

If you want to follow along, you can view the following blog post to provision a kubernetes cluster locally:
- https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/

Once you have provisioned your kubernetes cluster locally, you can proceed to [install helm](https://helm.sh/docs/intro/install/), I will make the assumption that you are using Mac:

```bash
brew install helm
```

Once helm has been installed, you can test the installation by listing any helm releases, by running:

```bash
helm list
```

## Helm Charts

Helm uses a packaging format called charts, which is a collection of files that describes a related set of kubernetes resources. A sinlge helm chart m
ight be used to deploy something simple such as a deployment or something complex that deploys a deployment, ingress, horizontal pod autoscaler, etc.


## Using Helm to deploy applications

So let's assume that we have our kubernetes cluster deployed, and now we are ready to deploy some applications to kubernetes, but we are unsure on how we would do that.

Let's assume we want to install Nginx.

First we would navigate to [artifacthub.io](https://artifacthub.io), which is a repository that holds a bunch of helm charts and the information on how to deploy helm charts to our cluster.

Then we would search for Nginx, which would ultimately let us land on:
- https://artifacthub.io/packages/helm/bitnami/nginx

On this view, we have super useful information such as how to use this helm chart, the default values, etc.

Now that we have identified the chart that we want to install, we can have a look at their readme, which will indicate how to install the chart:

```bash
$ helm repo add my-repo https://charts.bitnami.com/bitnami
$ helm install my-release my-repo/nginx
```

But before we do that, if we think about it, we add a repository, then before we install a release, we could first find information such as the release versions, etc.

So the way I would do it, is to first add the repository:

```bash
$ helm repo add bitnami https://charts.bitnami.com/bitnami
```

Then since we have added the repository, we can update our repository to ensure that we have the latest release versions:

```bash
$ helm repo update
```

Now that we have updated our local repositories, we want to find the release versions, and we can do that by listing the repository in question. For example, if we don't know the application name, we can search by the repository name:

```bash
$ helm search repo bitnami/ --versions
```

In this case we will get an output of all the applications that is currently being hosted by Bitnami.

If we know the repository and the release name, we can extend our search by using:

```bash
$ helm search repo bitnami/nginx --versions
```

In this case we get an output of all the Nginx release versions that is currently hosted by Bitnami.

## Installing a Helm Release

Now that we have received a response from `helm search repo`, we can see that we have different release versions, as example:

```bash
NAME                            	CHART VERSION	APP VERSION	DESCRIPTION
bitnami/nginx                   	13.2.22      	1.23.3     	NGINX Open Source is a web server that can be a...
bitnami/nginx                   	13.2.21      	1.23.3     	NGINX Open Source is a web server that can be a...
```

For each helm chart, the chart has default values which means, when we install the helm release it will use the default values which is defined by the helm chart.

We have the concept of overriding the default values with a yaml configuration file we usually refer to `values.yaml`, that we can define the values that we want to override our default values with.

To get the current default values, we can use `helm show values`, which will look like the following:

```bash
$ helm show values bitnami/nginx --version 13.2.22
```

That will output to standard out, but we can redirect the output to a file using the following:

```bash
$ helm show values bitnami/nginx --version 13.2.22 > nginx-values.yaml
```

Now that we have redirected the output to `nginx-values.yaml`, we can inspect the default values using `cat nginx-values.yaml`, and any values that we see that we want to override, we can edit the yaml file and once we are done we can save it.

Now that we have our override values, we can install a release to our kubernetes cluster.

Let's assume we want to install nginx to our cluster under the name `my-nginx` and we want to deploy it to the namespace called `web-servers`:

```bash
$ helm upgrade --install my-nginx bitnami/nginx --values nginx-values.yaml --namespace web-servers --create-namespace --version 13.2.22
```

In the example above, we defined the following:

- `upgrade --install`                          - meaning we are installing a release, if already exists, do an upgrade
- `my-nginx`                                   - use the release name `my-nginx`
- `bitnami/nginx`                              - use the repository and chart named nginx
- `--values nginx-values.yaml`                 - define the values file with the overrides
- `--namespace web-servers --create-namespace` - define the namespace where the release will be installed to, and create the namespace if not exists
- `--version 13.2.22`                          - specify the version of the chart to be installed

## Information about the release

We can view information about our release by running:

```bash
$ helm list -n web-servers
```

## Creating your own helm charts

It's very common to create your own helm charts when you follow a common pattern in a microservice architecture or something else, where you only want to override specific values such as the container image, etc.

In this case we can create our own helm chart using:

```bash
$ helm create my-cart
```

This will create a scaffoliding project with the required information that we need to create our own helm chart.

To see more information, we can have a look at:

- https://github.com/ruanbekker/helm-charts

Which provides information on how to create a helm chart and how to host it on Github.

## Resources

Please find the following information with regards to Helm documentation:
- https://helm.sh/docs/
- https://helm.sh/docs/chart_template_guide/

If you need a kubernetes cluster and you would like to run this locally, find the following documentation in order to do that:
- https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

