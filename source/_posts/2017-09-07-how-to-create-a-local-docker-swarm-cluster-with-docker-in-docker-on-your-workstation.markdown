---
layout: post
title: "How to create a Local Docker Swarm Cluster with Docker in Docker on your Workstation"
date: 2017-09-07 04:03:37 -0400
comments: true
categories: ["docker", "swarm", "containers"] 
---

Creating a Docker Swarm Cluster, locally on your Workstation using Docker in Docker (DID) for testing Purposes:

## Project Resources:

- [Docker in Docker](https://hub.docker.com/_/docker/)
- [Traefik](https://docs.traefik.io/)

## Create The Nodes:

Create the Docker containers that will act as our Docker nodes:

```bash
$ docker run --privileged --name docker-node1 -v /Users/ruan/docker/did/vols/node1:/var/lib/docker -d docker:dind --storage-driver=vfs
$ docker run --privileged --name docker-node2 -v /Users/ruan/docker/did/vols/node2:/var/lib/docker -d docker:dind --storage-driver=vfs
$ docker run --privileged --name docker-node3 -v /Users/ruan/docker/did/vols/node3:/var/lib/docker -d docker:dind --storage-driver=vfs
```

## Initialize the Swarm:

Log onto the manager node:

```bash
$ docker exec -it docker-node1 sh
```

Initialize the Swarm:

```bash
$ docker swarm init --advertise-addr eth0
Swarm initialized: current node (17ydtkqdwxzwea2riadxj4zbw) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-4goolm8dvwictc7d39aonpcv6ca1pfj31q7irjga17o2srzf6f-b4k3hln6ogvjgmnbs1qxnjvj9 172.17.0.2:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

Join the Worker Nodes to the Swarm:

```bash
$ docker exec -it docker-node2 sh
/ # docker swarm join --token SWMTKN-1-4mvb68vefr3dogxr6omu3uq04r4gddftdbmfomxo9pefks9siu-3t7ua7k2xigl9rwgp4dwzcxm0 172.17.0.2:2377
This node joined a swarm as a worker.
```

```bash
$ docker exec -it docker-node3 sh
/ # docker swarm join --token SWMTKN-1-4mvb68vefr3dogxr6omu3uq04r4gddftdbmfomxo9pefks9siu-3t7ua7k2xigl9rwgp4dwzcxm0 172.17.0.2:2377
This node joined a swarm as a worker.
```

## List the Nodes:

Log onto the Manager node and list the nodes:

```bash
$ docker exec -it docker-node1 sh
/ # docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
1hnq4b4w87w6trobwye5ap4sh *   5657c28bf618        Ready               Active              Leader
wglbb029g1kczttiaf5r6iavi     b2924bb8e555        Ready               Active
xxr9kdqy49u2tx61w31ife90j     6622a06a1b3c        Ready               Active
```

## Traefik:

Creating a HTTP Reverse Proxy, using Traefik:

```bash
$ docker network create --driver overlay traefik-net
$ docker service create \
--name traefik \
--constraint 'node.role==manager' \
--publish 80:80 \
--publish 8080:8080 \
--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
--network traefik-net \
traefik:camembert --docker --docker.swarmmode --docker.domain=ruanbekker.internal --docker.watch --logLevel=DEBUG --web
```
