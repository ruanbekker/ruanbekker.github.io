---
layout: post
title: "Set Docker Environment Variables during Build Time"
date: 2018-04-07 09:51:35 -0400
comments: true
categories: ["docker", "environment", "12factor"] 
---

When using that `ARG` option in your Dockerfile, you can specify the `--build-args` option to define the value for the key that you specify in your Dockerfile to use for a environment variable as an example.

Today we will use the `arg` and `env` to set environment variables at build time.

## The Dockerfile:

Our Dockerfile

```dockerfile
FROM alpine:edge
ARG NAME
ENV OWNER=${NAME:-NOT_DEFINED}
CMD ["sh", "-c", "echo env var: ${OWNER}"]
```

Building our Image, we will pass the value to our NAME argument:

```bash
$ docker build --build-arg NAME=james -t ruan:test .
```

Now when we run our container, we will notice that the build time argument has passed through to our environment variable from the running container:

```bash
$ docker run -it ruan:test 
env var: james

```

When we build the image without specifying build arguments, and running the container:

```bash
$ docker build -t ruan:test .
$ docker run -it ruan:test 
env var: NOT_DEFINED
```
