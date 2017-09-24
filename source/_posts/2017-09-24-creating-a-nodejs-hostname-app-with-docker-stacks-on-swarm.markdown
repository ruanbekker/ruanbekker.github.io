---
layout: post
title: "Creating a Nodejs Hostname App with Docker Stacks on Swarm"
date: 2017-09-24 17:52:51 -0400
comments: true
categories: ["docker", "docker-swarm", "docker-stacks", "nodejs", "docker-compose", "javascript", "haproxy"] 
---

Create a Nodejs Application that responds GET requests with its Hostname.

Our nodejs application will sit beind a HAProxy Load Balancer, we are mounting the `docker.sock` from the host to the container, so as we scale our web application, our load balancer is aware of the changes, and scales as we scale our web application.

## Creating the Application:

Our nodejs application: 

```javascript app.js
var http = require('http');
var os = require('os');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`My Hostname: ${os.hostname()}\n`);
}).listen(8080);
```

Our Dockerfile:

```docker Dockerfile
FROM node:alpine
ADD app.js /app.js
CMD ["node", "/app.js"]
```

Build and Push to your registry, or you could use my image on Dockerhub: [hub.docker.com/r/rbekker87/node-containername](https://hub.docker.com/r/rbekker87/node-containername/)

```bash Build and Push
$ docker login
$ docker build -t <username>/<repo>:<tag> .
$ docker push  <username>/<repo>:<tag>
```

## Creating the Compose file

Create the compose file that will define our services:

```bash docker-compose.yml
version: '3'

services:
  node-app:
    image: rbekker87/node-containername
    networks:
      - nodenet
    environment:
      - SERVICE_PORTS=8080
    deploy:
      replicas: 20
      update_config:
        parallelism: 5
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
        window: 120s

  loadbalancer:
    image: dockercloud/haproxy:latest
    depends_on:
      - node-app
    environment:
      - BALANCE=leastconn
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 80:80
    networks:
      - nodenet
    deploy:
      placement:
        constraints: [node.role == manager]

networks:
  nodenet:
    driver: overlay
```

## Create the Stack:

Deploy the Stack by specifying the compose file and name of our stack:

```bash Deploy our Stack
$ docker stack deploy -c docker-compose.yml node
```

List the Services in the Stack:

```bash List Services in our Stack
$ docker stack ls
NAME                SERVICES
node                2
```

List the Tasks in the Stack:

```bash Tasks in our Stack
$ docker stack ps node
ID                  NAME                  IMAGE                                 NODE     DESIRED STATE       CURRENT STATE            ERROR               PORTS
l5ryfaedzzaq        node_loadbalancer.1   dockercloud/haproxy:latest            dsm-01   Running             Running 40 minutes ago
c8nrrcvek79h        node_node-app.5       rbekker87/node-containername:latest   dsm-01   Running             Running 40 minutes ago
dqii18b2q5nn        node_node-app.10      rbekker87/node-containername:latest   dsm-01   Running             Running 40 minutes ago
vkpw2rugy0ah        node_node-app.11      rbekker87/node-containername:latest   dsm-01   Running             Running 40 minutes ago
mm88nvnvy5lg        node_node-app.12      rbekker87/node-containername:latest   dsm-01   Running             Running 40 minutes ago
oyx8rfqc1xl2        node_node-app.16      rbekker87/node-containername:latest   dsm-01   Running             Running 41 minutes ago
```

## Test out our Application

Test out the Service:

```bash GET Requests
$ curl -XGET http://127.0.0.1/
My Hostname: a6e34246e73b

$ curl -XGET http://127.0.0.1/
My Hostname: 5de71278be38

$ curl -XGET http://127.0.0.1/
My Hostname: e0b7316fdd51
```

## Scaling Out:

Scale our Application out to 30 replica's 

```bash Scaling Up
$ docker service scale node-app=30
```

Scale our Application down to 10 replica's

```bash Scaling Down
$ docker service scale node-app=10
```

## Cleanup

Remove the Stack:

```bash Delete the Stack
$ docker stack rm node
Removing service node_loadbalancer
Removing service node_node-app
Removing network node_nodenet
```

## Resources:

- https://github.com/ruanbekker/docker-node-containername
- https://hub.docker.com/r/rbekker87/node-containername/
- [Resource 1](https://medium.com/@nirgn/load-balancing-applications-with-haproxy-and-docker-d719b7c5b231) + [Resource 2](http://anokun7.github.io/microservices-demo/)
