---
layout: post
title: "Increase Performance with your Ghost Blog on Docker"
date: 2020-06-08 23:28:07 +0200
description: "Increase your blog performance by adding a nginx reverse proxy with caching enabled on Docker"
comments: true
categories: ["docker", "ghost", "nginx", "caching"] 
---

![nginx-blog-ghost-caching](https://img.sysadmins.co.za/wngib2.png)

Nginx Caching + Ghost == Great Performance.

In this post we will build a nginx reverse proxy with caching enabled for our static content such as images, which will be our frontend and therefore we will have port 80 exposed, and run our ghost blog as our backend, which we will proxy traffic through from our nginx container.

## But why would you want caching?

Returning data from memory is a lot faster than returning data from disk, and in this case where a request is being made against nginx, then it proxy passes the request to ghost, gets the data that you requested and returns the data to the client.

So for items that rarely changes like images, we can benefit from caching, so the images can be returned from the nginx service, where the first request will be made to ghost and then it will be loaded into nginx cache, so then the next time when you request the same image it will be returned from cache instead of making that same request to ghost again.

## Caching Info

For this demonstration once we define the size of our chache which will be 500MB and we specify that if an object has not been accessed for 24 hours, we can expire the object from the cache.

## Nginx

We will build our nginx container by adding our custom nginx config to our dockerfile.

Our `Dockerfile` will look like the following:

```
ROM nginx:stable
ADD nginx.conf /etc/nginx/nginx.conf
```

Our `nginx.conf` configuration file:

```
events {
  worker_connections  1024;
}

http {
  default_type       text/html;
  access_log         /dev/stdout;
  sendfile           on;
  keepalive_timeout  65;

  #proxy_cache_path /tmp/ghostcache levels=1:2 keys_zone=ghostcache:500m max_size=2g inactive=30d;
  proxy_cache_path /tmp/ghostcache levels=1:2 keys_zone=ghostcache:60m max_size=500m inactive=24h;
  proxy_cache_key "$scheme$request_method$host$request_uri";
  proxy_cache_methods GET HEAD;

  server {
    listen 80;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass http://ghost:2368;
    }

    location ~* \.(?:css|js|ico)$ {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass http://ghost:2368;
        access_log off;
    }

    location ^~ /content/images/ {
        proxy_cache ghostcache;
        proxy_cache_valid 60m;
        proxy_cache_valid 404 1m;
        proxy_ignore_headers Set-Cookie;
        proxy_hide_header Set-Cookie;
        proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
        proxy_ignore_headers Cache-Control;
        add_header X-Cache-Status $upstream_cache_status;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://ghost:2368;
        access_log off;
    }
  }
}
```

Then our `docker-compose.yml` where we will add our nginx and ghost container to run together:

```
version: '3.4'

services:
  ghost:
    image: ghost:3.15.1
    container_name: 'ghost'
    environment:
      - NODE_ENV=production
      - url=http://localhost:80
    networks:
      - ghost
    volumes:
      - ghost_content:/var/lib/ghost/content/data

  proxy:
    build: .
    container_name: 'proxy'
    depends_on:
      - ghost
    ports:
      - 80:80
    networks:
      - ghost

networks:
  ghost: {}

volumes:
  ghost_content: {}
```

To boot our stack:

```
$ docker-compose up
```

## Test Caching

Once your containers are in a running state, open your browsers devloper tools and look at the networking tab, then access your ghost blog on `http://localhost:80/`, the first time a image is opened you should see the cache shows `MISS` when you refresh again you should see a `HIT`, which means that the object is being returned from your cache.
