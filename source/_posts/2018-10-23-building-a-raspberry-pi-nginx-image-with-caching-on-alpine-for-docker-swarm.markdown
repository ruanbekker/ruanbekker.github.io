---
layout: post
title: "Building a Raspberry Pi Nginx Image with Caching on Alpine for Docker Swarm"
date: 2018-10-23 17:00:02 -0400
comments: true
categories: ["raspberrypi", "ghost", "nginx", "caching", "docker", "swarm", "alpine"]
---

In this guide, we will be creating a nginx reverse proxy with the ability to cache static content using a alpine image.

We will then push the image to gitlab's private registry, and then run the service on docker swarm.

## Create the backend service:

We will upstream to our blog using ghost, which you can deploy using:

```bash
$ docker service create --name blog --network docknet rbekker87/armhf-ghost:2.0.3
```

## Current File Structure:

Our file structure for the assets we need to build the reverse proxy:

```
$ find .
./conf.d
./conf.d/blog.conf
./Dockerfile
./nginx.conf
```

- `Dockerfile`

```
FROM hypriot/rpi-alpine-scratch
MAINTAINER Ruan Bekker

RUN apk update && \
    apk add nginx && \
    rm -rf /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/lib/nginx && \
    rm -rf /var/cache/apk/*

ADD nginx.conf /etc/nginx/
ADD conf.d/blog.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- `nginx.conf`

```
user nginx;
worker_processes 1;

events {
    worker_connections 1024;
    }

error_log  /var/log/nginx/nginx_error.log warn;

http {

    sendfile	      on;
    tcp_nodelay	      on;

    gzip              on;
    gzip_http_version 1.0;
    gzip_proxied      any;
    gzip_min_length   500;
    gzip_disable      "MSIE [1-6]\.";
    gzip_types        text/plain text/xml text/css
                      text/comma-separated-values
                      text/javascript
                      application/x-javascript
                      application/atom+xml;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;
    error_log   /var/log/nginx/error.log;

    proxy_cache_path /var/cache/nginx/ levels=1:2 keys_zone=nginx_cache:5m max_size=128m inactive=60m;

    keepalive_timeout  60;
    server_tokens      off;

    include /etc/nginx/conf.d/*.conf;

}
```

Hostname resolution to our Ghost Blog Service: In our swarm we have a service called blog which is associated to the docknet network, so the dns resolution will resolve to the vip of the service. As seen in the figure below:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                                                    PORTS
nq42a6jfwx3d        blog                replicated          1/1                 rbekker87/armhf-ghost:2.0.3
```

- `conf.d/blog.conf`

```
upstream ghost_blog {
    server blog:2368;
    }

server {
    listen 80;
    server_name blog.yourdomain.com;

    access_log  /var/log/nginx/blog_access.log  main;
    error_log   /var/log/nginx/blog_error.log;

    location / {

        proxy_cache                 nginx_cache;
        add_header                  X-Proxy-Cache $upstream_cache_status;
        proxy_ignore_headers        Cache-Control;
        proxy_cache_valid any       10m;
        proxy_cache_use_stale       error timeout http_500 http_502 http_503 http_504;

        proxy_pass                  http://ghost_blog;
        proxy_redirect              off;

        proxy_set_header            Host $host;
        proxy_set_header            X-Real-IP $remote_addr;
        proxy_set_header            X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header            X-Forwarded-Host $server_name;
    }
}
```

## Building the Image and Pushing to Gitlab

I'm using Gitlab in this demonstration, but you can use the registry of your choice:

```
$ docker login registry.gitlab.com
$ docker build -t registry.gitlab.com/user/docker/arm-nginx:caching .
$ docker tag registry.gitlab.com/user/docker/arm-nginx:caching registry.gitlab.com/user/docker/arm-nginx:caching
$ docker push registry.gitlab.com/user/docker/arm-nginx:caching
```

## Deploy

Create the Nginx Reverse Proxy Service on Docker Swarm:

```
$ docker service create --name nginx_proxy \
--network docknet \
--publish 80:80 \
--replicas 1 \
--with-registry-auth registry.gitlab.com/user/docker/arm-nginx:caching
```

Listing our Services:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                                                    PORTS
je7x21l7egoh        nginx_proxy         replicated          1/1                 registry.gitlab.com/user/docker/arm-nginx:caching   *:80->80/tcp
nq42a6jfwx3d        blog                replicated          1/1                 rbekker87/armhf-ghost:2.0.3
```

Once you access your proxy on port 80, you should see your Ghost Blog Homepage like below:

![](https://objects.ruanbekker.com/assets/images/ghost-blog-main.png)

Have a look at the [benchmark performance](https://blog.ruanbekker.com/blog/2018/10/23/nginx-caching-performance-for-static-content-on-docker-swarm-with-raspberrypi/) when using Nginx with caching enabled

## Resources:

- https://hub.docker.com/r/rbekker87/armhf-ghost/
