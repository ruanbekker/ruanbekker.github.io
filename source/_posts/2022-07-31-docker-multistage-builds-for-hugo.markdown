---
layout: post
title: "Docker Multistage Builds for Hugo"
date: 2022-07-31 02:23:51 -0400
description: "This tutorial demonstrates how to use multistage builds using docker to take advantage of reducing the size of your final container image. This demonstration will use Hugo as an example."
comments: true
categories: ["hugo", "docker"]
---

![blog-ruanbekker-multistage-builds](https://user-images.githubusercontent.com/567298/182013196-aff6e76f-2cf3-4ec2-bfcc-3e977915a6aa.png)

In this tutorial I will demonstrate how to keep your docker **container images** nice and **slim** with the use of **multistage builds** for a **hugo** documentation project.

Hugo is a static content generator so essentially that means that it will **generate your markdown files into html**. Therefore we don't need to include all the content from our project repository as we only need the static content (html, css, javascript) to reside on our **final container image**.

## What are we doing today

We will use the **[DOKS](https://github.com/h-enk/doks)** Modern Documentation theme for **[Hugo](https://gohugo.io/)** as our project example, where we will build and run our documentation website on a docker container, but more importantly make use of multistage builds to **optimize the size** of our **container image**.

## Our Build Strategy

Since hugo is a static content generator, we will use a **[node](https://hub.docker.com/_/node)** container image as our base. We will then build and generate the content using `npm run build` which will generate the static content to `/src/public` in our build stage.

Since we then have static content, we can utilize a second stage using a **[nginx](https://hub.docker.com/_/nginx)** container image with the purpose of a **web server** to host our **static content**. We will copy the static content from our `build` stage into our second stage and place it under our defined path in our nginx config.

This way we only include the required content on our final container image.

## Building our Container Image

First clone the [docs github repository](https://github.com/h-enk/doks) and change to the directory:

```bash
git clone https://github.com/h-enk/doks
cd doks
```

Now create a `Dockerfile` in the root path with the following content:

```dockerfile
FROM node:16.15.1 as build
WORKDIR /src
ADD . .
RUN npm install
RUN npm run build

FROM  nginx:alpine
LABEL demonstration.by Ruan Bekker <@ruanbekker>
COPY  nginx/config/nginx.conf /etc/nginx/nginx.conf
COPY  nginx/config/app.conf /etc/nginx/conf.d/app.conf
COPY  --from=build /src/public /usr/share/nginx/app
```

As we can see we are copying two nginx config files to our final image, which we will need to create.

Create the nginx config directory:

```bash
mkdir -p nginx/config
```

The content for our main nginx config `nginx/config/nginx.conf`:

```
user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;

    # timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout  25;
    send_timeout 10;

    # buffer size
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 4 4k;
    
    # gzip compression
    gzip  on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
    gzip_disable "MSIE [1-6]\.";

    include /etc/nginx/conf.d/app.conf;
}
```

And in our main nginx config we are including a virtual host config `app.conf`, which we will create locally, and the content of `nginx/config/app.conf`:

```
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/app;
        index  index.html index.htm;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

}
```

Now that we have our docker config in place, we can build our container image:

```bash
docker build -t ruanbekker/hashnode-docs-blogpost:latest .
```

Then we can review the **size** of our container image, which is only `27.4MB` in size, pretty neat right.

```bash
docker images --filter reference=ruanbekker/hashnode-docs-blogpost

REPOSITORY                          TAG       IMAGE ID       CREATED          SIZE
ruanbekker/hashnode-docs-blogpost   latest    5b60f30f40e6   21 minutes ago   27.4MB
```

## Running our Container 

Now that we've built our container image, we can run our documentation site, by specifying our host port on the left to map to our container port on the right in `80:80`:

```bash
docker run -it -p 80:80 ruanbekker/hashnode-docs-blogpost:latest
```

When you don't have port 80 already listening prior to running the previous command, when you head to [http://localhost](http://localhost) (if you are running this locally), you should see our documentation site up and running:

![blog-ruanbekker-multistage-builds](https://user-images.githubusercontent.com/567298/182013196-aff6e76f-2cf3-4ec2-bfcc-3e977915a6aa.png)

## Thank You

I have published this container image to [ruanbekker/hashnode-docs-blogpost](https://hub.docker.com/r/ruanbekker/hashnode-docs-blogpost).

Thanks for reading, feel free to check out my **[website](https://ruan.dev)**, feel free to subscribe to my **[newsletter](http://digests.ruanbekker.com/?via=hashnode)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

