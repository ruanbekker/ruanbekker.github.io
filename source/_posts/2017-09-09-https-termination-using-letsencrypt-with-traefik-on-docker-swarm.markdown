---
layout: post
title: "HTTPS Termination using LetsEncrypt with Traefik on Docker Swarm"
date: 2017-09-09 18:40:15 -0400
comments: true
categories: ["docker", "traefik", "letsencrypt", "https", "swarm", "docker-swarm-apps"]
---

We will setup a HTTPS Termination on Traefik for our Java Web Application using Payara Micro, that will sit behind our Traefik proxy. In this guide, I will be using GitLab's Private Registry for pushing my Images to.

## Traefik Dockerfile:

Our Traefik Dockerfile:

```docker Traefik Dockerfile
FROM traefik
ADD traefik.toml .
EXPOSE 80
EXPOSE 8080
EXPOSE 443
```

## traefik.toml

Our Traefik config: `traefik.toml`

```toml traefik.toml
defaultEntryPoints = ["http", "https"]

[web]
address = ":8080"

[entryPoints]

[entryPoints.http]
address = ":80"

[entryPoints.https]
address = ":443"

[entryPoints.https.tls]

[acme]
email = "recipient@domain.com"
storage = "acme.json"
entryPoint = "https"
onDemand = false
OnHostRule = true

[docker]
endpoint = "unix:///var/run/docker.sock"
domain = "apps.domain.com"
watch = true
exposedbydefault = false
```

## Build the Image:

Login to GitLab's Registry, build and push the image:

```bash
$ docker login registry.gitlab.com
$ docker build -t registry.gitlab.com/<user>/<repo>/traefik:latest .
$ docker push registry.gitlab.com/<user>/<repo>/traefik:latest
```

## Traefik:

Create the Traefik Proxy Service:

```bash
$ docker service create \
--name traefik \
--constraint 'node.role==manager' \
--publish 80:80 \
--publish 443:443 \
--publish 8080:8080 \
--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
--network appnet \
--with-registry-auth registry.gitlab.com/<user>/<repo>/traefik:latest \
--docker \
--docker.swarmmode \
--docker.domain=apps.domain.com \
--docker.watch \
--logLevel=DEBUG \
--web
```

## Java Web Application:

Our Java Web Applications Dockerfile:

```docker Dockerfile
FROM payara/micro
COPY app.war /opt/payara/deployments/app.war
```

Build and Push the Image to our GitLab Registry:

```bash
$ docker build -t registry.gitlab.com/<user>/<repo>/java_web:latest .
$ docker push registry.gitlab.com/<user>/<repo>/java_web:latest
```

Create the Java Web Application on Docker Swarm, specifiying our `Host`, and also a `PathPrefix`, so that the Traefik Proxy can accept requests for the `Hostname`, and anything from `/app/`

```bash
$ docker service create \
--name java_web \
--label 'traefik.port=8080' \
--label traefik.frontend.rule="Host:apps.domain.com; PathPrefix: /app/" \
--network appnet \
--with-registry-auth registry.gitlab.com/<user>/<repo>/java_web:latest
```

## Resources:

- https://gist.github.com/nknapp/20c7cd89f1f128b8425dd89cbad0b802
- https://niels.nu/blog/2017/traefik-https-letsencrypt.html

<center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
