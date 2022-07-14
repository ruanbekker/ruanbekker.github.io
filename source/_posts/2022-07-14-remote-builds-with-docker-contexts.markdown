---
layout: post
title: "Remote Builds with Docker Contexts"
date: 2022-07-14 01:57:34 -0400
comments: true
description: "see how you can use remote docker contexts to save your laptops battery life by running computational heavy tasks on a remote docker engine with docker contexts"
categories: ["docker", "devops"]
---

![using-docker-contexts](https://blog.ruanbekker.com/images/ruanbekker-docker-contexts.png)

Often you want to save some battery life when you are doing docker builds and leverage a remote host to do the intensive work and we can utilise docker context over ssh to do just that.

## About

In this tutorial I will show you how to use a remote docker engine to do docker builds, so you still run the docker client locally, but the context of your build will be sent to a remote docker engine via ssh.

We will setup password-less ssh, configure our ssh config, create the remote docker context, then use the remote docker context.

![image](https://user-images.githubusercontent.com/567298/178909518-26f580e9-2b96-41b3-bacd-a5ea5f848ebf.png)

## Password-less SSH

I will be copying my public key to the remote host:

```bash
$ ssh-copy-id ruan@192.168.2.18
```

Setup my ssh config:

```bash
$ cat ~/.ssh/config
Host home-server
    Hostname 192.168.2.18
    User ruan
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

Test:

```
$ ssh home-server whoami
ruan
```

## Docker Context

On the target host (192.168.2.18) we can verify that docker is installed:

```bash
$ docker version
Client: Docker Engine - Community
 Version:           20.10.12
 API version:       1.41
 Go version:        go1.16.12
 Git commit:        e91ed57
 Built:             Mon Dec 13 11:45:37 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.12
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.16.12
  Git commit:       459d0df
  Built:            Mon Dec 13 11:43:46 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.12
  GitCommit:        7b11cfaabd73bb80907dd23182b9347b4245eb5d
 runc:
  Version:          1.0.2
  GitCommit:        v1.0.2-0-g52b36a2
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

On the client (my laptop in this example), we will create a docker context called "home-server" and point it to our target host:

```bash
$ docker context create home-server --docker "host=ssh://home-server"
home-server
Successfully created context "home-server"
```

Now we can list our contexts:

```bash
docker context ls
NAME                TYPE                DESCRIPTION                               DOCKER ENDPOINT               KUBERNETES ENDPOINT                                  ORCHESTRATOR
default *           moby                Current DOCKER_HOST based configuration   unix:///var/run/docker.sock   https://k3d-master.127.0.0.1.nip.io:6445 (default)   swarm
home-server         moby                                                          ssh://home-server
```

## Using Contexts

We can verify if this works by listing our cached docker images locally and on our remote host:

```bash
$ docker --context=default images | wc -l
 16
```

And listing the remote images by specifying the context:

```bash
$ docker --context=home-server images | wc -l
 70
```

We can set the default context to our target host:

```
$ docker context use home-server
home-server
```

## Running Containers over Contexts

So running containers with remote contexts essentially becomes running containers on remote hosts. In the past, I had to setup a ssh tunnel, point the docker host env var to that endpoint, then run containers on the remote host.

Thats something of the past, we can just point our docker context to our remote host and run the container. If you haven't set the default context, you can specify the context, so running a docker container on a remote host with your docker client locally:

```bash
$ docker --context=home-server run -it -p 8002:8080 ruanbekker/hostname
2022/07/14 05:44:04 Server listening on port 8080
```

Now from our client (laptop), we can test our container on our remote host:

```bash
$ curl http://192.168.2.18:8002
Hostname: 8605d292e2b4
```

The same way can be used to do remote docker builds, you have your Dockerfile locally, but when you build, you point the context to the remote host, and your context (dockerfile and files referenced in your dockerfile) will be sent to the remote host. This way you can save a lot of battery life as the computation is done on the remote docker engine.

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.
