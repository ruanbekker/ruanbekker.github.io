---
layout: post
title: "Build a Traefik Proxy Image for your Raspberry Pi on Docker Swarm"
date: 2018-10-23 17:31:02 -0400
comments: true
categories: ["raspberrypi", "traefik", "docker", "swarm"]
---

![](https://objects.ruanbekker.com/assets/images/pistack-header-a.png)

In this post we will setup a Docker Image for Traefik Proxy on the ARM Architecture, specifically on the Raspberry Pi, which we will deploy to our Raspberry Pi Docker Swarm. 

Then we will build and push our image to a registry, then setup traefik and also setup a web application that sits behind our Traefik Proxy.

## What is Traefik

[Traefik](https://traefik.io/) is a modern load balancer and reverse proxy built for micro services.

## Dockerfile

We will be running Traefik on Alpine 3.8:

```dockerfile
FROM rbekker87/armhf-alpine:3.8

ENV TRAEFIK_VERSION 1.7.0-rc3
ENV ARCH arm

ADD https://github.com/containous/traefik/releases/download/v${TRAEFIK_VERSION}/traefik_linux-${ARCH} /traefik

RUN apk add --no-cache ca-certificates \
    && chmod +x /traefik \
    && rm -rf /var/cache/apk/*

EXPOSE 80 8080 443

ENTRYPOINT ["/traefik"]
```

## Build and Push

Build and Push your image to your registry of choice:

```bash
$ docker build -t your-user/repo:tag .
$ docker push your-user/repo:tag
```

If you do not want to push to a registry, I have a public image available at [https://hub.docker.com/r/rbekker87/armhf-traefik/](https://hub.docker.com/r/rbekker87/armhf-traefik/), the image itself is `rbekker87/armhf-traefik:1.7.0-rc3`

## Deploy Traefik to the Swarm

From our `traefik-compose.yml`, you will notice that I have set that our network is external, so the network should exist prior to deploying the stack.

Let's create the overlay network:

```bash
$ docker network create --driver overlay appnet
```

Below, the `traefik-compose.yml`, note that I'm using pistack.co.za as my domain:

```yml
version: "3.4"

services:
  traefik: 
    image: rbekker87/armhf-traefik:1.7.0-rc3
    command:
      - "--api"
      - "--docker"
      - "--docker.swarmmode"
      - "--docker.domain=pistack.co.za"
      - "--docker.watch"
      - "--logLevel=DEBUG"
      - "--web"
    networks:
      - appnet
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 80:80
      - 8080:8080
    deploy:
      mode: global
      restart_policy:
        condition: on-failure
      placement:
        constraints: [node.role == manager]

networks:
  appnet:
    external: true
```

Deploy the stack:

```bash
$ docker stack deploy -c traefik-compose.yml proxy
```

List the stacks:

```bash
$ docker stack ls
NAME                SERVICES
proxy               1
```

Check if the services in your stack is running. Since our deploy mode was global, there will be a replica running on each node, and in my swarm I've got 3 nodes:

```bash
$ docker stack services proxy
ID                  NAME                MODE                REPLICAS            IMAGE                    PORTS
16x31j7o0f0r        proxy_traefik       global              3/3                 rbekker87/armhf-traefik:1.7.0-rc3   *:80->80/tcp,*:8080->8080/tcp
```

## Deploy a Web Service hooked up to Traefik

Pre-Requirement:

To register subdomains on the fly, set you DNS for your domain to the following (im using pistack.co.za in this example):

- `pistack.co.za` `A` `x.x.x.x`
- `*.pistack.co.za` `A` `x.x.x.x`

Next, we will deploy we app that will be associated to our Traefik service domain, so we will inform Traefik that our web app fqdn and port that will be registered with the proxy.

Our `app-compose.yml` file for our webapp:

```yml
version: "3.4"

services:
  whoami:
    image: rbekker87/golang-whoami:alpine-amrhf
    networks:
      - appnet
    deploy:
      replicas: 3
      labels:
        - "traefik.backend=whoami"
        - "traefik.port=80"
        - "traefik.frontend.rule=Host:whoami.pistack.co.za"
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      placement:
        constraints: [node.role == worker]
    healthcheck:
      test: nc -vz 127.0.0.1 80 || exit 1
      interval: 60s
      timeout: 3s
      retries: 3

networks:
  appnet:
    external: true
```

In the above compose, you will notice that our traefik backend is set to our service name, our port is the port that the proxy will forward requests to the containers port, since the proxy and the whoami container is in the same network, they will be able to communicate with each other. Then we also have our frontend rule which will be the endpoint we will reach our application on.

Deploy the stack:

```bash
$ docker stack deploy -c whoami.yml web
Creating service web_whoami
```

List the tasks running in our web stack:

```bash
$ docker stack services web
ID                  NAME                MODE                REPLICAS            IMAGE                                  PORTS
31ylfcfb7uyw        web_whoami          replicated          3/3                 rbekker87/golang-whoami:alpine-amrhf
```

Once all the replicas is running, move along to test the application

## Testing our Application:

I have 3 replicas each running on their own container, so each container will respond with its own hostname:

```bash
$ docker service ps web_whoami
ID                  NAME                IMAGE                                  NODE                DESIRED STATE       CURRENT STATE            ERROR                              PORTS
ivn8fgfosvgd        web_whoami.1        rbekker87/golang-whoami:alpine-amrhf   rpi-01              Running             Running 26 minutes ago
rze6u6z56aop        web_whoami.2        rbekker87/golang-whoami:alpine-amrhf   rpi-02              Running             Running 26 minutes ago
6fjua869r498        web_whoami.3        rbekker87/golang-whoami:alpine-amrhf   rpi-04              Running             Running 23 minutes ago
```

Making our 1st GET request:

```bash
$ $ curl http://whoami.pistack.co.za/
Hostname: 43f5f0a6682f
IP: 127.0.0.1
IP: 10.0.0.138
IP: 10.0.0.218
IP: 172.18.0.4
GET / HTTP/1.1
Host: whoami.pistack.co.za
User-Agent: curl/7.38.0
Accept: */*
Accept-Encoding: gzip
X-Forwarded-For: 165.73.96.95, 10.255.0.2
X-Forwarded-Host: whoami.pistack.co.za
X-Forwarded-Port: 80
X-Forwarded-Proto: http
X-Forwarded-Server: 31b37f9714d3
X-Real-Ip: 10.255.0.2
```

Our 2nd GET Request:

```bash
$ curl http://whoami.pistack.co.za/
Hostname: d1c17a476414
IP: 127.0.0.1
IP: 10.0.0.138
IP: 10.0.0.71
IP: 172.19.0.5
GET / HTTP/1.1
Host: whoami.pistack.co.za
User-Agent: curl/7.38.0
Accept: */*
Accept-Encoding: gzip
X-Forwarded-For: 165.73.96.95, 10.255.0.2
X-Forwarded-Host: whoami.pistack.co.za
X-Forwarded-Port: 80
X-Forwarded-Proto: http
X-Forwarded-Server: 02b0ff6eab73
X-Real-Ip: 10.255.0.2
```

And our 3rd GET Request:

```
$ curl http://whoami.pistack.co.za/
Hostname: 17c817a1813b
IP: 172.18.0.6
IP: 127.0.0.1
IP: 10.0.0.138
IP: 10.0.0.73
GET / HTTP/1.1
Host: whoami.pistack.co.za
User-Agent: curl/7.38.0
Accept: */*
Accept-Encoding: gzip
X-Forwarded-For: 165.73.96.95, 10.255.0.2
X-Forwarded-Host: whoami.pistack.co.za
X-Forwarded-Port: 80
X-Forwarded-Proto: http
X-Forwarded-Server: 31b37f9714d3
X-Real-Ip: 10.255.0.2
```

Hope this was useful.

## Resources:

- https://hub.docker.com/r/rbekker87/armhf-traefik/tags/
- https://github.com/containous/traefik/releases
- https://github.com/ruanbekker/traefik-armhf/blob/master/Dockerfile 
