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
$ mkdir ~/charts
$ cd ~/charts
$ helm create my-chart
```

This will create a scaffoliding project with the required information that we need to create our own helm chart. If we look at a tree view, it will look like the following:

```bash
$ tree . 
.
└── my-chart
    ├── Chart.yaml
    ├── charts
    ├── templates
    │   ├── NOTES.txt
    │   ├── _helpers.tpl
    │   ├── deployment.yaml
    │   ├── hpa.yaml
    │   ├── ingress.yaml
    │   ├── service.yaml
    │   ├── serviceaccount.yaml
    │   └── tests
    │       └── test-connection.yaml
    └── values.yaml

4 directories, 10 files
```

This example chart can already be used, to see what this chart will produce when running it with helm, we can use the `helm template` command:

```bash
$ cd my-chart
$ helm template example . --values values.yaml
```

The output will be something like the following:

```yaml
---
# Source: my-chart/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-my-chart
  labels:
    helm.sh/chart: my-chart-0.1.0
    app.kubernetes.io/name: my-chart
    app.kubernetes.io/instance: example
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: my-chart
          image: "nginx:1.16.0"
          ...
---
...
```

In our example it will create a service account, service, deployment, etc.

As you can see the `spec.template.spec.containers[].image` is set to `nginx:1.16.0`, and to see how that was computed, we can have a look at `templates/deployment.yaml`:

<script src="https://gist.github.com/ruanbekker/908dfeef90ef6edf8d2e40dc6c49bebf.js"></script>

As you can see in `image:` section we have `.Values.image.repository` and `.Values.image.tag`, and those values are being retrieved from the `values.yaml` file, and when we look at the `values.yaml` file:

```yaml
image:
  repository: nginx
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: ""
```

If we want to override the image repository and image tag, we can update the `values.yaml` file to lets say:

```yaml
image:
  repository: busybox
  tag: latest
  pullPolicy: IfNotPresent
```

When we run our helm template command again, we can see that the computed values changed to what we want:

```bash
$ helm template example . --values values.yaml
---
# Source: my-chart/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-my-chart
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: my-chart
          image: "busybox:latest"
          imagePullPolicy: IfNotPresent
      ...
```

Another way is to use `--set`:

```bash
$ helm template example . --values values.yaml --set image.repository=ruanbekker/containers,image.tag=curl
spec:
  template:
    spec:
      containers:
        - name: my-chart
          image: "ruanbekker/containers:curl"
      ...
```

The template subcommand provides a great way to debug your charts. To learn more about helm charts, view their [documentation](https://helm.sh/docs/topics/charts/).

## Publish your Helm Chart to ChartMuseum

[ChartMuseum](https://chartmuseum.com/) is an open-source Helm Chart Repository server written in Go.

Running chartmuseum demonstration will be done locally on my workstation using Docker. To run the server:

```bash
$ docker run --rm -it \
  -p 8080:8080 \
  -e DEBUG=1 \
  -e STORAGE=local \
  -e STORAGE_LOCAL_ROOTDIR=/charts \
  -v $(pwd)/charts:/charts \
  ghcr.io/helm/chartmuseum:v0.14.0
```

Now that ChartMuseum is running, we will need to install a helm plugin called `helm-push` which helps to push charts to our chartmusuem repository:

```bash
$ helm plugin install https://github.com/chartmuseum/helm-push
```

We can verify if our plugin was installed:

```bash
$ helm plugin list
NAME    	VERSION	DESCRIPTION
cm-push 	0.10.3 	Push chart package to ChartMuseum
```

Now we add our chartmuseum helm chart repository, which we will call `cm-local`:

```bash
$ helm repo add cm-local http://localhost:8080/
```

We can list our helm repository:

```bash
$ helm repo list
NAME                	URL
cm-local            	http://localhost:8080/
```

Now that our helm repository has been added, we can push our helm chart to our helm chart repository. Ensure that we are in our chart repository directory, where the `Chart.yaml` file should be in our current directory. We need this file as it holds metadata about our chart.

We can view the `Chart.yaml`:

```yaml
apiVersion: v2
name: my-chart
description: A Helm chart for Kubernetes
type: application
version: 0.1.0
appVersion: "1.16.0"
```

Push the helm chart to chartmuseum:

```bash
$ helm cm-push . http://localhost:8080/ --version 0.0.1
Pushing my-chart-0.0.1.tgz to http://localhost:8080/...
Done.
```

Now we should update our repositories so that we can get the latest changes:

```bash
$ helm repo update
```

Now we can list the charts under our repository:

```bash
$ helm search repo cm-local/
NAME             	CHART VERSION	APP VERSION	DESCRIPTION
cm-local/my-chart	0.0.1        	1.16.0     	A Helm chart for Kubernetes
```

We can now get the values for our helm chart by running:

```bash
$ helm show values cm-local/my-chart
```

This returns the values yaml that we can use for our chart, so let's say you want to output the values yaml so that we can use to to deploy a release we can do:

```bash
$ helm show values cm-local/my-chart > my-values.yaml
```

Now when we want to deploy a release, we can do:

```bash
$ helm upgrade --install my-release cm-local/my-chart --values my-values.yaml --namespace test --create-namespace --version 0.0.1
```

After the release was deployed, we can list the releases by running:

```bash
$ helm list
```

And to view the release history:

```bash
$ helm history my-release
```

## Resources

Please find the following information with regards to Helm documentation:
- [helm docs](https://helm.sh/docs/)
- [helm cart template guide](https://helm.sh/docs/chart_template_guide/)

If you need a kubernetes cluster and you would like to run this locally, find the following documentation in order to do that:
- [using kind for local kubernetes clusters](https://blog.ruanbekker.com/blog/2022/09/20/kind-for-local-kubernetes-clusters/)

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

