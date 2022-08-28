---
layout: post
title: "Setup RocketChat on Docker Swarm"
date: 2017-09-10 18:45:12 -0400
comments: true
categories: ["rocketchat", "mongodb", "docker", "swarm", "chat"] 
---

Rocket Chat, a Self Hosted Alternative, which is very similar to Slack. 

We will setup a RocketChat Server which is hosted on Docker Swarm. In future posts, I will also go through the steps on working with the API, Custom Emoji's etc.

## Requirements:

RocketChat uses MongoDB as its Database, we will keep the database outside of our swarm, if you don't already have a MongoDB Server in place, follow the [Setup a 3 Node MongoDB](http://blog.ruanbekker.com/blog/2017/09/02/setup-a-3-node-mongodb-replica-set-on-ubuntu-16/) post to get that sorted.

Another requirement is to have docker swarm running, alternatively, you can also follow [RocketChat's Documentation](https://rocket.chat/docs/installation/) if you prefer setting it up elsewhere.

## Setup Rocket Chat

We will assume MongoDB is accessible via `mongodb.domain.com` on port `27017`, with a username and password.

Creating the RocketChat service and associate it to our `appnet` overlay network:

```bash
docker service create --name rocketchat \
--replicas 1 \
--network appnet \
--env DEPLOY_METHOD=docker \
--env NODE_ENV=production \
--env PORT=3000 \
--env MONGO_URL="mongodb://mongoadmin:mongopass@mongodb.domain.com:27017/rocketchat?authSource=admin" \
--env ROOT_URL=http://rocketchat.domain.com \
--env ADMIN_USERNAME=myadmin \
--env ADMIN_PASS=secret \
--env ADMIN_EMAIL=mail@domain.com \
--env Accounts_AvatarStorePath=/app/uploads \
--secret rocketchat_secret \
rocketchat/rocket.chat
```

## View the RocketChat Service Logs

Lets monitor the docker service logs for our rocketchat service:

```bash
$ docker service logs -f rocketchat

rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Using GridFS for custom sounds storage
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Using GridFS for custom emoji storage
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | ufs: temp directory created at "/tmp/ufs"
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | System startup
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | +--------------------------------------------------------------+
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |                        SERVER RUNNING                        |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | +--------------------------------------------------------------+
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |                                                              |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |  Rocket.Chat Version: 0.58.2                                 |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |       NodeJS Version: 4.8.4 - x64                            |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |             Platform: linux                                  |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |         Process Port: 3000                                   |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |             Site URL: http://rocketchat.domain.com           |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |     ReplicaSet OpLog: Disabled                               |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |          Commit Hash: 988103d449                             |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |        Commit Branch: HEAD                                   |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | |                                                              |
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | +--------------------------------------------------------------+
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Inserting admin user:
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Name: Administrator
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Email: mail@domain.com
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Username: myadmin
rocketchat.1.lnbyfjiotqpz@docker-swarm-worker-03    | Password: secret
```

Now you should be able to access Rocket Chat on the `ROOT_URL` that you have specified.

## Resources:

- https://rocket.chat/docs/installation/
- https://github.com/RocketChat/Docker.Official.Image
- https://rocket.chat/docs/installation/docker-containers

<center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>

