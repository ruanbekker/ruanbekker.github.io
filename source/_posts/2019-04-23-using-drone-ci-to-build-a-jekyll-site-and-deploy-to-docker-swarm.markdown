---
layout: post
title: "Using Drone CI to Build a Jekyll Site and Deploy to Docker Swarm"
description: "cicd pipelines - build a jekyll site and deploy to docker swarm with drone ci"
date: 2019-04-23 17:57:02 -0400
comments: true
categories: ["drone", "cicd", "devops", "docker", "swarm", "github"]
---

![image](https://user-images.githubusercontent.com/567298/56618556-3de7ca00-6623-11e9-995f-c22792f0ab21.png)

CICD Pipelines! <3 

In this post I will show you how to setup a cicd pipeline using drone to build a jekyll site and deploy to docker swarm. 

## Environment Overview

**Jekyll's Codebase**: Our code will be hosted on Github (I will demonstrate how to set it up from scratch)

**Secret Store**: Our secrets such as ssh key, swarm host address etc will be stored in drones secrets manager

**Docker Swarm**: Docker Swarm has Traefik as a HTTP Loadbalancer 

**Drone Server and Agent**: If you dont have drone, you can setup [drone server and agent on docker](https://blog.ruanbekker.com/blog/2019/04/18/setup-a-drone-cicd-environment-on-docker-with-letsencrypt/) or have a look at [cloud.drone.io](https://cloud.drone.io)

**Workflow:**

```
* Whenever a push to master is receive on github, the pipeline will be triggered
* The content from our github repository will be cloned to the agent on a container
* Jekyll will build and the output will be transferred to docker swarm using rsync
* The docker-compose.yml will be transferred to the docker swarm host using scp
* A docker stack deploy is ran via ssh
```

## Install Jekyll Locally

Install Jekyll locally, as we will use it to create the initial site. I am using a mac, so I will be using `brew`. For other operating systems, have a look at [this post](https://jekyllrb.com/docs/installation/).

I will be demonstrating with a weightloss blog as an example.

Install jekyll:

```
$ brew install jekyll
```

Go ahead and create a new site which will host the data for your jekyll site:

```
$ jekyll new blog-weightloss
```

## Create a Github Repository

First we need to create an empty github repository, in my example it was `github.com/ruanbekker/blog-weightloss.git`. Once you create the repo change into the directory created by the `jekyll new` command:

```
$ cd blog-weightloss
```

Now initialize git, set the remote, add the jekyll data and push to github:

```
$ git init
$ git remote add origin git@github.com:ruanbekker/blog-weightloss.git # <== change to your repository
$ git add .
$ git commit -m "first commit"
$ git push origin master
```

You should see your data on your github repository.

## Create Secrets on Drone

Logon to the Drone UI, sync repositories, activate the new repository and head over to settings where you will find the secrets section.

Add the following secrets:

```
Secret Name: swarm_host
Secret Value: ip address of your swarm

Secret Name: swarm_key
Secret Value: contents of your private ssh key

Secret Name: swarm_user
Secret Value: the user that is allowed to ssh
```

You should see the following:

![image](https://user-images.githubusercontent.com/567298/56619871-5c4fc480-6627-11e9-8820-c9d4ddff698c.png)

## Add the Drone Config

Drone looks from a `.drone.yml` file in the root directory for instructions on how to do its tasks. Lets go ahead and declare our pipeline:

```
$ vim .drone.yml
```

And populate the drone config:

```
pipeline:
  jekyll-build:
    image: jekyll/jekyll:latest
    commands:
      - touch Gemfile.lock
      - chmod a+w Gemfile.lock
      - chown -R jekyll:jekyll /drone
      - gem update --system
      - gem install bundler
      - bundle install
      - bundle exec jekyll build

  transfer-build:
    image: drillster/drone-rsync
    hosts:
      from_secret: swarm_host
    key:
      from_secret: swarm_key
    user:
      from_secret: swarm_user
    source: ./*
    target: ~/my-weightloss-blog.com
    recursive: true
    delete: true
    when:
      branch: [master]
      event: [push]

  transfer-compose:
    image: appleboy/drone-scp
    host:
      from_secret: swarm_host
    username:
      from_secret: swarm_user
    key:
      from_secret: swarm_key
    target: /root/my-weightloss-blog.com
    source:
      - docker-compose.yml
    when:
      branch: [master]
      event: [push]

  deploy-jekyll-to-swarm:
    image: appleboy/drone-ssh
    host:
      from_secret: swarm_host
    username:
      from_secret: swarm_user
    key:
      from_secret: swarm_key
    port: 22
    script:
      - docker stack deploy --prune -c /root/my-weightloss-blog.com/docker-compose.yml apps
    when:
      branch: [master]
      event: [push]
```

## Add the Docker Compose

Next we need to declare our docker compose file which is needed to deploy our jekyll service to the swarm:

```
$ vim docker-compose.yml
```

And populate this info (just change the values for your own environment/settings):

```yaml
version: '3.5'

services:
  myweightlossblog:
    image: ruanbekker/jekyll:contrast
    command: jekyll serve --watch --force_polling --verbose
    networks:
      - appnet
    volumes:
      - /root/my-weightloss-blog.com:/srv/jekyll
    deploy:
      mode: replicated
      replicas: 1
      labels:
        - "traefik.backend.loadbalancer.sticky=false"
        - "traefik.backend.loadbalancer.swarm=true"
        - "traefik.backend=myweightlossblog"
        - "traefik.docker.network=appnet"
        - "traefik.entrypoints=https"
        - "traefik.frontend.passHostHeader=true"
        - "traefik.frontend.rule=Host:www.my-weightloss-blog.com,my-weightloss-blog.com"
        - "traefik.port=4000"
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.role == manager
networks:
  appnet:
    external: true
```

## Push to Github

Now we need to push our `.drone.yml` and `docker-compose.yml` to github. Since the repository is activated on drone, any push to master will trigger the pipeline, so after this push we should go to drone to look at our pipeline running.

Add the untracked files and push to github:

```
$ git add .drone.yml
$ git add docker-compose.yml
$ git commit -m "add drone and docker config"
$ git push origin master
```

As you head over to your drone ui, you should see your pipeline output which will look more or less like this (just look how pretty it is! :D )

![image](https://user-images.githubusercontent.com/567298/56620236-91a8e200-6628-11e9-9278-38e3305fdcd7.png)

## Test Jekyll

If your deployment has completed you should be able to access your application on the configured domain. A screenshot of my response when accessing Jekyll:

![image](https://user-images.githubusercontent.com/567298/56620280-af764700-6628-11e9-9d4f-c2592e6cf561.png)

Absolutely Amazingness! I really love drone! 
