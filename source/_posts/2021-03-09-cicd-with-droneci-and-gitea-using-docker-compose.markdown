---
layout: post
title: "CICD with DroneCI and Gitea using Docker Compose"
date: 2021-03-09 01:10:10 -0500
comments: true
categories: ["devops", "gitea", "drone", "docker"]
---

In this post we wil set up a drone-ci and gitea stack using docker-compose and then running a test pipeline. 

I have posted a few times about this topic, but this post will be used when I create other examples and wanting to use this post for the ones not having the stack booted yet.

## The Source Code

All the code will be in my [github repository](https://github.com/ruanbekker/drone-gitea-on-docker). 

For our `docker-compose.yml`:

```
version: '3.6'

services:
  gitea:
    container_name: gitea
    image: gitea/gitea:${GITEA_VERSION:-1.10.6}
    restart: unless-stopped
    environment:
      # https://docs.gitea.io/en-us/install-with-docker/#environments-variables
      - APP_NAME="Gitea"
      - USER_UID=1000
      - USER_GID=1000
      - RUN_MODE=prod
      - DOMAIN=${IP_ADDRESS}
      - SSH_DOMAIN=${IP_ADDRESS}
      - HTTP_PORT=3000
      - ROOT_URL=http://${IP_ADDRESS}:3000
      - SSH_PORT=222
      - SSH_LISTEN_PORT=22
      - DB_TYPE=sqlite3
    ports:
      - "3000:3000"
      - "222:22"
    networks:
      - cicd_net
    volumes:
      - ./gitea:/data

  drone:
    container_name: drone
    image: drone/drone:${DRONE_VERSION:-1.6.4}
    restart: unless-stopped
    depends_on:
      - gitea
    environment:
      # https://docs.drone.io/server/provider/gitea/
      - DRONE_DATABASE_DRIVER=sqlite3
      - DRONE_DATABASE_DATASOURCE=/data/database.sqlite
      - DRONE_GITEA_SERVER=http://${IP_ADDRESS}:3000/
      - DRONE_GIT_ALWAYS_AUTH=false
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}
      - DRONE_SERVER_PROTO=http
      - DRONE_SERVER_HOST=${IP_ADDRESS}:3001
      - DRONE_TLS_AUTOCERT=false
      - DRONE_USER_CREATE=${DRONE_USER_CREATE}
      - DRONE_GITEA_CLIENT_ID=${DRONE_GITEA_CLIENT_ID}
      - DRONE_GITEA_CLIENT_SECRET=${DRONE_GITEA_CLIENT_SECRET}
    ports:
      - "3001:80"
      - "9001:9000"
    networks:
      - cicd_net
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./drone:/data

  drone-runner:
    container_name: drone-runner
    image: drone/drone-runner-docker:${DRONE_RUNNER_VERSION:-1}
    restart: unless-stopped
    depends_on:
      - drone
    environment:
      # https://docs.drone.io/runner/docker/installation/linux/
      # https://docs.drone.io/server/metrics/
      - DRONE_RPC_PROTO=http
      - DRONE_RPC_HOST=drone
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}
      - DRONE_RUNNER_NAME="${HOSTNAME}-runner"
      - DRONE_RUNNER_CAPACITY=2
      - DRONE_RUNNER_NETWORKS=cicd_net
      - DRONE_DEBUG=false
      - DRONE_TRACE=false
    ports:
      - "3002:3000"
    networks:
      - cicd_net
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

networks:
  cicd_net:
    name: cicd_net
```

Our `boot.sh` which we will use to override environment variables:

```
#!/usr/bin/env bash

export HOSTNAME=$(hostname)
export DRONE_VERSION=1.10.1
export DRONE_RUNNER_VERSION=1.6.3
export GITEA_VERSION=1.13
export IP_ADDRESS=192.168.0.6
export MINIO_ACCESS_KEY="EXAMPLEKEY"
export MINIO_SECRET_KEY="EXAMPLESECRET"
export GITEA_ADMIN_USER="example"
export DRONE_RPC_SECRET="$(echo ${HOSTNAME} | openssl dgst -md5 -hex)"
export DRONE_USER_CREATE="username:${GITEA_ADMIN_USER},machine:false,admin:true,token:${DRONE_RPC_SECRET}"
export DRONE_GITEA_CLIENT_ID=""
export DRONE_GITEA_CLIENT_SECRET=""
docker-compose up -d

echo ""
echo "Gitea: http://${IP_ADDRESS}:3000/"
echo "Drone: http://${IP_ADDRESS}:3001/"
```

## Deploy the Stack

Set the following in your `boot.sh`:

```
IP_ADDRESS=192.168.0.6       -> either reachable dns or ip address which will be your clone address and ui addresses.
GITEA_ADMIN_USER="giteauser" -> will be the user you register with in drone
```

Now boot the stack:

```
$ bash boot.sh
```

*Note*: Theres a [current issue](https://github.com/go-gitea/gitea/issues/7702) where webhooks get fired twice, if you see that just restart gitea with `docker restart gitea`.

- Head over to: `http://${IP_ADDRESS}:3000/user/settings/applications` and create a new OAuth2 Application and set the Redirect URI to `http://${IP_ADDRESS}:3001/login`

- Capture the client id and client secret and populate them in the `boot.sh` in `DRONE_GITEA_CLIENT_ID` and `DRONE_GITEA_CLIENT_SECRET` and run `bash boot.sh` again. This will give drone the correct credentials in order to authenticate with gitea.

- Now when you head over to `http://${IP_ADDRESS}:3001/` you will be asked to authorize the application and you should be able to access drone.

## Drone CLI

Install Drone CLI:
- https://docs.drone.io/cli/install/

```
$ curl -L https://github.com/drone/drone-cli/releases/latest/download/drone_darwin_amd64.tar.gz | tar zx
$ sudo mv drone /usr/local/bin/drone
$ chmod +x /usr/local/bin/drone
```

Get your Drone Token:
- http://${IP_ADDRESS}:3001/account

```
$ export DRONE_SERVER=http://${IP_ADDRESS}:3001
$ export DRONE_TOKEN=one-from-the-account-page
drone info
```

## Build your first pipeline

Create a test repo in gitea:

![image](https://user-images.githubusercontent.com/567298/110296470-0ad23800-7ffb-11eb-8428-af49d0ebd62d.png)

Commit a `.drone.yml` file for drone:

```
kind: pipeline
type: docker
name: hello-world

trigger:
  branch:
    - master
  event:
    - push

steps:
  - name: say-hello
    image: busybox
    commands:
      - echo hello-world
```

Head over to drone and sync your repositories:

![image](https://user-images.githubusercontent.com/567298/110296425-00b03980-7ffb-11eb-9216-76725a62c09e.png)

Activate your repository:

![image](https://user-images.githubusercontent.com/567298/110296623-3523f580-7ffb-11eb-805f-db5db4dab0cb.png)

Push a commit to master and see your pipeline running:

![image](https://user-images.githubusercontent.com/567298/110296747-584ea500-7ffb-11eb-9909-259641a663aa.png)

## More Examples

For more examples view my example section on the github repository:
- https://github.com/ruanbekker/drone-gitea-on-docker#more-examples
