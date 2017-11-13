---
layout: post
title: "Local Dev Environment with Docker MySQL and Adminer WebUI with Docker Compose"
date: 2017-11-13 16:15:34 -0500
comments: true
categories: ["docker", "docker-compose", "mysql", "adminer"] 
---

Let's setup a local development environment with Docker, MySQL and Adminer WebUI using Docker Compose

## Docker Compose File:

Let's look at our docker-compose file:

```yml
version: '3.2'

services:
  mysql-client:
    image: alpine:edge
    volumes:
      - type: bind
        source: ./workspace
        target: /root/workspace
    networks:
      - docknet
    command: ping 127.0.0.1

  db:
    image: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
    networks:
      - docknet
    volumes:
      - type: volume
        source: dbdata
        target: /var/lib/mysql

  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
    networks:
      - docknet

networks:
    docknet:
        external: true

volumes:
  dbdata:
    external: true
```

## Pre-Requirements:

Let's create our pre-requirement:

1. Networks:

```bash
$ docker network create docknet
```

2. Volumes:

Our Volume for MySQL so that we have persistent data:

```bash
$ docker volume create dbdata
```

Our `workspace` directory that will be persistent in our `debug-client` alpine container:

```bash
$ mkdir -p workspace/python
```

## Launching our Services:

Let's launch our services:

```bash 
$ docker-compose -f mysql-compose.yml up -d
Creating mysql_db_1 ...
Creating mysql_adminer_1
Creating mysql_debug-client_1
```

Listing our Containers:

```bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                      NAMES
e05804ab6d64        alpine:edge         "ping 127.0.0.1"         21 seconds ago      Up 4 seconds                                   mysql_debug-client_1
c052ceeb6d3b        mysql               "docker-entrypoint..."   21 seconds ago      Up 5 seconds        3306/tcp                   mysql_db_1
2b0446daab4c        adminer             "entrypoint.sh doc..."   26 seconds ago      Up 5 seconds        0.0.0.0:8080->8080/tcp     mysql_adminer_1
```

## Using the Debug Container:

I will use the debug container as the client to connect to the internal services, for example, the mysql-client:

```bash
$ apk update
$ apk add mysql-client
$ mysql -h db -u root -ppassword
MySQL [(none)]>
```

Also, you will find the persistent data directory for our workspace:

```bash
$ ls /root/workspace/
python
```

## Accessing the MySQL WebUI: Adminer

Access the service via the exposed endpoint:

```bash
+ http://localhost:8080/
```

The login view:

![](https://i.snag.gy/m8dUxe.jpg)

Creating the Table:

![](https://i.snag.gy/tPVbg6.jpg)

## Deleting the Environment:

The External Resources will not be deleted:

```bash
$ docker-compose -f mysql-compose.yml down
Removing mysql_debug-client_1 ... done
Removing mysql_db_1           ... done
Removing mysql_adminer_1      ... done
Network docknet is external, skipping
```
