---
layout: post
title: "Modern Reverse Proxy with Traefik on Docker Swarm"
date: 2017-08-24 19:00:33 -0400
comments: true
categories: ["docker", "traefik", "proxy"] 
---

![](https://dl.dropboxusercontent.com/u/31991539/images/traefik.png)

[Traefik](https://traefik.io/) is a modern load balancer and reverse proxy built for micro services.

We will build 4 WebServices with Traefik, where we will go through the following scenarios:

- Hostname Based Routingi (With Path's and Without)
- Path Based Routing 


## Pre-Requisites:

From your DNS Provider add wildcard entries to the Docker Swarm Public IPs:

- `apps.domain.com` -> A Record to each Docker Swarm Node
- `*.apps.domain.com` => apps.doamin.com

This will allow us to create web applications on the fly.

## Static Website with Traefik:

Create Traefik Proxy:

```
docker service create \
--name traefik \
--constraint 'node.role==manager' \
--publish 80:80 \
--publish 443:443 \
--publish 8080:8080 \
--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
--network appnet \
traefik:camembert \
--docker --docker.swarmmode  \
--docker.domain=apps.domain.com \
--docker.watch \
--logLevel=DEBUG \
--web
```

## Build a WebService with 2 Endpoints:

Our Website will have:

- `/`
- `/test/`

Our `Dockerfile`:

```
FROM alpine:edge

RUN apk update \
    && apk add lighttpd

ADD htdocs /var/www/localhost/htdocs

CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
```

Our `htdocs` directory:

```
find ./htdocs/
./htdocs/
./htdocs/index.html
./htdocs/test
./htdocs/test/index.html
```

Building and Push the Image to a Registry of your choice:

```
docker login registry.gitlab.com
docker build -t registry.gitlab.com/<user>/<repo>/lighttpd:test
docker push registry.gitlab.com/<user>/<repo>/lighttpd:test
```

## Create the 1st Service, No Hostname or Path based specified:

The Service will allow us to view `/` and `/test/` paths, and also enable us to use the service name as the subdomain, or the domain specified in the `traefik` service:

```
docker service create --name web1 --label 'traefik.port=80'  --network appnet --with-registry-auth registry.gitlab.com/<user>/<repo>/lighttpd:test
```

Testing the service:

```
$ curl http://web1.apps.domain.com/
<html>
Root Page
</html>
```

```
$ curl http://web2.apps.domain.com/test/
<html>
Test Page
</html>
```

and


```
$ curl http://apps.domain.com/test/
<html>
Test Page
</html>
```

but

```
$ curl http://foo.apps.domain.com/test/
404 page not found
```


## Create the 2nd Service, Only 1 Path Based Routing:

This service will only allow us to view the `/test/` endpoint:

```
$ docker service create --name website2 --label 'traefik.port=80' --label traefik.frontend.rule="Path: /test/" --network appnet --with-registry-auth registry.gitlab.com/<user>/<repo>/lighttpd:test
```

Testing the Service:

```
$ curl http://web1.apps.domain.com/
404 page not found
```

```
$ curl http://web2.apps.domain.com/test/
<html>
Test Page
</html>
```

## Hostname Based and Path Based Routing:

```
$ docker service create \
--name web3 \
--label 'traefik.port=80' \
--label traefik.frontend.rule="Host:apps.domain.com; Path: /test/" \
--network appnet \
--with-registry-auth registry.gitlab.com/rbekker87/docker/lighttpd:u1t-test
```

Test the `/` endpoint, which should not work:

```
$ curl  http://apps.domain.com/
404 page not found
```

and the `/test/` endpoint:

```
$ curl  http://apps.domain.com/test/
<html>
Test Page
</html>
```

Also, any other FQDN that is specified will not work as it does not match the `traefik.frontend.rule`:

```
$ curl  http://web3.apps.domain.com/
404 page not found
```

## Strictly Hostname Based Routing and not specifying any paths:

```
$ docker service create \
--name web4 \
--label 'traefik.port=80' \
--label traefik.frontend.rule="Host:apps.domain.com" \
--network appnet \
--with-registry-auth registry.gitlab.com/<user>/<repo>/lighttpd:u1t-test
```

Testing the Service:

```
$ curl http://apps.domain.com/
<html>
Root Page
</html>
```

```
$ curl http://apps.domain.com/test/
<html>
Test Page
</html>
```

Anything specified other than that, will result in a 404 Response.

