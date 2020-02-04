---
layout: post
title: "Run Kubernetes (k3s) as a Service Container on Drone CI"
date: 2020-02-04 22:37:06 +0200
comments: true
categories: ["kubernetes", "drone", "cicd", "devops"] 
---

[Drone services](https://docs.drone.io/pipeline/docker/syntax/services/) allow you to run a service container and will be available for the duration of your build, which is great if you want a ephemeral service to test your applications against. 

Today we will experiment with services on [drone](https://github.com/drone/drone)  and will deploy a [k3s](https://github.com/rancher/k3s) (a kubernetes distribution built by rancher) cluster as a drone service and interact with our cluster using kubectl.

I will be using multiple pipelines, where we will first deploy our "dev cluster", when it's up, we will use kubectl to interact with the cluster, once that is done, we will deploy our "staging cluster" and do the same.

This is very basic and we are not doing anything special, but this is a starting point and you can do pretty much whatever you want.

## What is Drone

If you are not aware of Drone, Drone is a container-native continious deliver platform built on Go and you can check them out [here: github.com/drone](https://github.com/drone/drone)

## Setup Gitea and Drone

If you don't have the stack setup, have a look at [this post](https://blog.ruanbekker.com/blog/2020/02/04/setup-gitea-and-drone-on-docker-2020-edition/) where I go into detail on how to get that setup.

## Create your Git Repo

Go ahead and create a git repo, you can name it anything, then it should look something like this:

<img width="1171" alt="image" src="https://user-images.githubusercontent.com/567298/73783555-90ead200-479c-11ea-8386-12518fb21b22.png">

Create a drone configuration, `.drone.yml` my pipeline will look like this:

```
---
kind: pipeline
type: docker
name: dev

platform:
  os: linux
  arch: amd64

steps:
  - name: wait-for-k3s
    image: ruanbekker/build-tools
    commands:
      - sleep 30

  - name: prepare-k3s-kubeconfig
    image: alpine
    volumes:
      - name: k3s-kubeconfig
        path: /k3s-kubeconfig
    detach: false
    commands:
      - sed -i -e "s/127.0.0.1/k3s/g" /k3s-kubeconfig/kubeconfig.yaml

  - name: test-kubernetes
    image: ruanbekker/kubectl
    volumes:
      - name: k3s-kubeconfig
        path: /tmp
    environment:
      KUBECONFIG: /tmp/kubeconfig.yaml
    commands:
      - kubectl get nodes -o wide

services:
  - name: k3s
    image: rancher/k3s:v0.9.1
    privileged: true
    command:
      - server
    environment:
      K3S_KUBECONFIG_OUTPUT: /k3s-kubeconfig/kubeconfig.yaml
      K3S_KUBECONFIG_MODE: 777
    volumes:
      - name: k3s-kubeconfig
        path: /k3s-kubeconfig
    ports:
      - 6443

volumes:
- name: k3s-kubeconfig
  temp: {}

---
kind: pipeline
type: docker
name: staging

platform:
  os: linux
  arch: amd64

steps:
  - name: wait-for-k3s
    image: ruanbekker/build-tools
    commands:
      - sleep 30

  - name: prepare-k3s-kubeconfig
    image: alpine
    volumes:
      - name: k3s-kubeconfig
        path: /k3s-kubeconfig
    detach: false
    commands:
      - sed -i -e "s/127.0.0.1/k3s/g" /k3s-kubeconfig/kubeconfig.yaml

  - name: test-kubernetes
    image: ruanbekker/kubectl
    volumes:
      - name: k3s-kubeconfig
        path: /tmp
    environment:
      KUBECONFIG: /tmp/kubeconfig.yaml
    commands:
      - kubectl get nodes -o wide


services:
  - name: k3s
    image: rancher/k3s:v0.9.1
    privileged: true
    command:
      - server
    environment:
      K3S_KUBECONFIG_OUTPUT: /k3s-kubeconfig/kubeconfig.yaml
      K3S_KUBECONFIG_MODE: 777
    volumes:
      - name: k3s-kubeconfig
        path: /k3s-kubeconfig
    ports:
      - 6443

volumes:
- name: k3s-kubeconfig
  temp: {}

depends_on:
- dev
```

In this pipeline you can see that the staging pipeline depends on dev, so dev pipeline will start by creating the k3s service container, once its up I am using a step just to sleep for 30 seconds to allow it to boot.

Then I have defined a volume that will be persistent during the build time, which we will use to dump our kubeconfig file and update the hostname of our kubernetes endpoint. Once that is done our last step will set that file to the environment and use kubectl to interact with kubernetes.

Once our dev pipeline has finished, our staging pipeline will start.

## Activate the Repo in Drone

Head over to drone on port `80` and activate the newly created git repo (and make sure that you select "Trusted") and you will see the activity feed being empty:

<img width="1008" alt="image" src="https://user-images.githubusercontent.com/567298/73784085-80872700-479d-11ea-9005-4cac54ac000d.png">

Commit a dummy file to git and you should see your pipeline being triggered:

<img width="1013" alt="image" src="https://user-images.githubusercontent.com/567298/73784286-dd82dd00-479d-11ea-93f4-6363da53c1c1.png">

Once your pipeline has finished and everything succeeded, you should see the output of your nodes in your kubernetes service container:

<img width="1068" alt="image" src="https://user-images.githubusercontent.com/567298/73784435-220e7880-479e-11ea-8f9d-a9856632302d.png">

As I mentioned earlier, we are not doing anything special but service containers allows us to do some awesome things.

Thank you for reading. If you like my content, feel free to visit me at **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

[![](https://user-images.githubusercontent.com/567298/71188576-e2410f80-2289-11ea-8667-08f0c14ab7b5.png)](https://twitter.com/ruanbekker)

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A6423ZIQ)
