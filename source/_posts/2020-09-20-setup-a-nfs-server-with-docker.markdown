---
layout: post
title: "Setup a NFS Server with Docker"
date: 2020-09-20 16:07:09 +0000
comments: true
categories: ["nfs", "docker", "storage"]
description: "setup a nfs server with docker for persistent storage for your containers"
---

In this tutorial we will setup a **NFS Server** using **Docker** for our development environment.

## Host Storage Path

In this example we will be using our host path `/data/nfs-storage` which will host our storage for our NFS server, which will will mount to the container:

```
$ mkdir -p /data/nfs-storage
```

## NFS Server

Create the NFS Server with docker:

```
$ docker run -itd --privileged \
  --restart unless-stopped \
  -e SHARED_DIRECTORY=/data \
  -v /data/nfs-storage:/data \
  -p 2049:2049 \
  itsthenetwork/nfs-server-alpine:12
```

We can do the same using docker-compose, for our `docker-compose.yml`:

```
version: "2.1"
services:
  # https://hub.docker.com/r/itsthenetwork/nfs-server-alpine
  nfs:
    image: itsthenetwork/nfs-server-alpine:12
    container_name: nfs
    restart: unless-stopped
    privileged: true
    environment:
      - SHARED_DIRECTORY=/data
    volumes:
      - /data/nfs-storage:/data
    ports:
      - 2049:2049
```

To deploy using docker-compose:

```
$ docker-compose up -d
```

## NFS Client

To use a NFS Client to mount this to your filesystem, you can look at <a href="https://blog.ruanbekker.com/blog/2017/12/05/setup-a-nfs-server-on-a-raspberrypi/" rel="nofollow" target="_blank">this blogpost></a>

In summary:

```
$ sudo apt install nfs-client -y
$ sudo mount -v -o vers=4,loud 192.168.0.4:/ /mnt
```

Verify that the mount is showing:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2       109G   53G   51G  52% /
192.168.0.4:/   4.5T  2.2T  2.1T  51% /mnt
```

Now, create a test file on our NFS export:

```
$ touch /mnt/file.txt
```

Verify that the test file is on the local path:

```
$ ls /data/nfs-storage/
file.txt
```

If you want to load this into other client's `/etc/fstab`:

```
192.168.0.4:/   /mnt   nfs4    _netdev,auto  0  0
```

## NFS Docker Volume Plugin

You can use a NFS Volume Plugin for Docker or Docker Swarm for persistent container storage.

To use the NFS Volume plugin, we need to download <a href="https://github.com/ContainX/docker-volume-netshare/releases" target="_blank" rel="nofollow">docker-volume-netshare</a> from their github releases page.

```
$ wget https://github.com/ContainX/docker-volume-netshare/releases/download/v0.36/docker-volume-netshare_0.36_amd64.deb
$ dpkg -i docker-volume-netshare_0.36_amd64.deb
$ service docker-volume-netshare start
```

Then your `docker-compose.yml`:

```
version: '3.7'

services:
  mysql:
    image: mariadb:10.1
    networks:
      - private
    environment:
      - MYSQL_ROOT_PASSWORD=${DATABASE_PASSWORD:-admin}
      - MYSQL_DATABASE=testdb
      - MYSQL_USER=${DATABASE_USER:-admin}
      - MYSQL_PASSWORD=${DATABASE_PASSWORD:-admin}
    volumes:
      - mysql_data.vol:/var/lib/mysql

volumes:
  mysql_data.vol:
    driver: nfs
    driver_opts:
      share: 192.168.69.1:/mysql_data_vol
```

## Thank You

That's it. Thanks for reading, follow me on Twitter and say hi! <a href="https://twitter.com/ruanbekker" rel="nofollow" target="_blank"><strong>@ruanbekker</strong></a></p><p><a href="https://saythanks.io/to/ruan.ru.bekker@gmail.com" rel="nofollow" target="_blank"><img src="https://svgshare.com/i/Pfy.svg" alt="Say Thanks!"></a></p>
