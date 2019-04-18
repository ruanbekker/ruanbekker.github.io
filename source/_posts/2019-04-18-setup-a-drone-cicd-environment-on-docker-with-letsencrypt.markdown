---
layout: post
title: "Setup a Drone CICD Environment on Docker with Letsencrypt"
date: 2019-04-18 12:53:49 -0400
comments: true
categories: ["docker", "drone", "cicd", "devops", "pipelines", "golang"] 
---

![drone-ci](https://user-images.githubusercontent.com/567298/56378979-ed313500-620e-11e9-9ac0-4fcd1df803e8.png)


## What is Drone?

Drone is a self-service continuous delivery platform which can be used for CICD pipelines, devopsy stuff which is really awesome.

With Configuration as Code, Pipelines are configured with a simple, easy‑to‑read file that you commit to your git repository such as github, gitlab, gogs, gitea etc.

Each Pipeline step is executed inside an isolated Docker container that is automatically downloaded at runtime, if not found in cache.

## Show me pipelines!

A pipeline can look as easy as:

```yaml
kind: pipeline
steps:
- name: test
  image: node
  commands:
  - npm install
  - npm test
services:
- name: database
  image: mysql
  ports:
  - 3306
```

## Open for Testing!

I have enabled public access, so please go ahead and launch your cicd pipelines on my drone setup as I want to test the stability of it:

==> [https://drone.rbkr.xyz/](https://drone.rbkr.xyz/)

## What are we doing?

We will deploy a drone server which is responsible for the actual server and 2 drone agents which will receive instructions from the server whenever steps need to be executed. Steps run on agents.

## Deploy the Servers

I'm using VULTR to deploy 3 nodes on coreos, 1 drone server and 2 drone agents as seen below:

![image](https://user-images.githubusercontent.com/567298/56371668-d0403600-61fd-11e9-8396-01c07c136518.png)

Documentation:
https://docs.drone.io/installation/github/multi-machine/
https://github.com/settings/developers

We will use Github for version control and to delegate auth, therefore we need to register a new application on Github.

Register New Application on Github at https://github.com/settings/developer :

![register-application](https://user-images.githubusercontent.com/567298/56375985-22398980-6207-11e9-911d-9595f8f85db9.png)

Get your Drone-Server Host Endpoint, and update the fields:

![image](https://user-images.githubusercontent.com/567298/56374721-287a3680-6204-11e9-837f-a7751651c29a.png)


You will receive a Github Client ID, Secret which we will need later, which will look like this:

```
Client ID:
xx
Client Secret:
yyy
```

Generate the shared secret which will be used on the server and agent:

```
$ openssl rand -hex 16
eb83xxe19a3497f597f53044250df6yy
```

Create the Startup Script for Drone Server, which will just be a docker container running in detached mode. Note that you should use your own domain at `SERVER_HOST` and if you want to issue an certificate automatically keep `DRONE_TLS_AUTOCERT` to true.

```
$ cat > start_drone-server.sh << EOF
#!/usr/bin/env bash

set -ex

GITHUB_CLIENT_ID=xx
GITHUB_CLIENT_SECRET=yyy
SHARED_SECRET=eb83xxe19a3497f597f53044250df6yy
SERVER_HOST=drone.yourdomain.com
SERVER_PROTOCOL=https

docker run \
  --volume=/var/run/docker.sock:/var/run/docker.sock \
  --volume=/var/lib/drone:/data \
  --env=DRONE_GITHUB_SERVER=https://github.com \
  --env=DRONE_GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID} \
  --env=DRONE_GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET} \
  --env=DRONE_AGENTS_ENABLED=true \
  --env=DRONE_RPC_SECRET=${SHARED_SECRET} \
  --env=DRONE_SERVER_HOST=${SERVER_HOST} \
  --env=DRONE_SERVER_PROTO=${SERVER_PROTOCOL} \
  --env=DRONE_TLS_AUTOCERT=true \
  --publish=80:80 \
  --publish=443:443 \
  --restart=always \
  --detach=true \
  --name=drone \
  drone/drone:1
EOF
```

Create the startup script for the drone agent, note that this script needs to be placed on the agent nodes:

```
$ cat > start_drone-agent.sh << EOF
#!/usr/bin/env bash

set -ex

SHARED_SECRET=eb83xxe19a3497f597f53044250df6yy
AGENT_SERVER_HOST=https://drone.yourdomain.com
SERVER_PROTOCOL=https

docker run \
  --volume=/var/run/docker.sock:/var/run/docker.sock \
  --env=DRONE_RPC_SERVER=${AGENT_SERVER_HOST} \
  --env=DRONE_RPC_SECRET=${SHARED_SECRET} \
  --env=DRONE_RUNNER_CAPACITY=2 \
  --env=DRONE_RUNNER_NAME=${HOSTNAME} \
  --restart=always \
  --detach=true \
  --name=drone-agent-02 \
  drone/agent:1
EOF
```

Logon to the server node and start the drone server:

```
$ bash start_drone-agent.sh
```

Login to the agent nodes and start the agents:

```
$ bash start_drone-agent.sh
```

The server should show that it's listening on port 80 and 443:

```
$ docker ps
CONTAINER ID        IMAGE               COMMAND               CREATED             STATUS              PORTS                                      NAMES
8ea70fc7b967        drone/drone:1       "/bin/drone-server"   12 minutes ago      Up 12 minutes       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   drone
```

## Access Drone

Access your Drone instance on port 80 eg. http://drone.yourdomain.com you should be automatically redirected to port 443, which should direct you to a login page, which will look like this:

![drone-authorize](https://user-images.githubusercontent.com/567298/56375632-5eb8b580-6206-11e9-9ae8-92b2cd29abec.png)

Login with your github account and allow drone some time to sync your repositories:


![image](https://user-images.githubusercontent.com/567298/56373131-9e7c9e80-6200-11e9-83ce-e486b399468e.png)


## Add drone config to your repository:

Clone this repository: [https://github.com/ruanbekker/drone-ci-testing](https://github.com/ruanbekker/drone-ci-testing) which will contain the `.drone.yml` config which drone gets its instructions from.

Select a repository to activate, (drone-ci-testing in this case) head over to settings:

![image](https://user-images.githubusercontent.com/567298/56373298-f1565600-6200-11e9-8262-ac3162fed4f2.png)

Adding secret:

![image](https://user-images.githubusercontent.com/567298/56373209-c5d36b80-6200-11e9-90de-68c131480672.png)

Add more secrets:

![image](https://user-images.githubusercontent.com/567298/56373443-3da19600-6201-11e9-85a9-083bfcbd604a.png)

Your build list should be empty:

![image](https://user-images.githubusercontent.com/567298/56373533-6fb2f800-6201-11e9-8fa0-ab05e546c36e.png)

## Trigger a Build

Edit any of the files in the clone repository and you should see your build running:

![image](https://user-images.githubusercontent.com/567298/56374465-85c1b800-6203-11e9-8542-acd1d5729447.png)

When your build has completed:

![image](https://user-images.githubusercontent.com/567298/56374511-a25df000-6203-11e9-9eb8-d94a777a8b4a.png)

You can also find out where the step ran:

![image](https://user-images.githubusercontent.com/567298/56374667-084a7780-6204-11e9-9c5b-6672f6882411.png)

Run a couple of tests:

![image](https://user-images.githubusercontent.com/567298/56376356-e3f09a00-6207-11e9-8ca0-16e06e7c0379.png)

Get notified via slack:

![image](https://user-images.githubusercontent.com/567298/56376376-eeab2f00-6207-11e9-9af9-194cb5a3023b.png)

## Debugging

If your build fails, its most likely that you need the `slack_webhook` secret. You can remove the slack step which shouldhelp you get going with drone.

## More on Drone


Have a look at [this document](https://github.com/ruanbekker/drone-ci-testing/blob/master/README.md) for more examples or have a look at their [documentation](https://docs.drone.io/) as well as their extensive list of [plugins](http://plugins.drone.io/) and their [setup documentation](https://docs.drone.io/installation/github/multi-machine/) to become familiar with their configuration.


