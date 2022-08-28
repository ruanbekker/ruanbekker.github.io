---
layout: post
title: "Local Dev Environment for Mediawiki using Docker Compose"
date: 2018-12-19 08:22:36 -0500
comments: true
categories: ["docker", "mediawiki", "dev-environment", "mysql"] 
---

Let's setup a local development environment with Docker, Mediawiki, MySQL using Docker Compose

## Docker Compose File

Let's look at our docker-compose.yml file:

```yaml
version: "3.4"

services:

  db:
    image: mysql:5.6
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_USER=mw
      - MYSQL_DATABASE=mediawiki
      - MYSQL_PASSWORD=pass
    volumes:
      - /Users/ruan/workspace/docker/mediawiki/mediawiki-mysql-data:/var/lib/mysql
    networks:
      - mediawiki
    ports:
      - 3306:3306

  memcached:
    image: rbekker87/memcached:alpine
    environment:
      - MEMCACHED_USER=memcached
      - MEMCACHED_HOST=0.0.0.0
      - MEMCACHED_PORT=11211
      - MEMCACHED_MEMUSAGE=128
      - MEMCACHED_MAXCONN=1024
    networks:
      - mediawiki

  mediawiki:
    image: benhutchins/mediawiki:latest
    networks:
      - mediawiki
    environment:
      - MEDIAWIKI_DB_TYPE=mysql
      - MEDIAWIKI_DB_HOST=db
      - MEDIAWIKI_DB_USER=mw
      - MEDIAWIKI_DB_PASSWORD=pass
      - MEDIAWIKI_SITE_SERVER=http://localhost
      - MEDIAWIKI_SITE_NAME="My Lekke Wiki"
      - MEDIAWIKI_SITE_LANG=en
      - MEDIAWIKI_ADMIN_USER=admin
      - MEDIAWIKI_ADMIN_PASS=password123
      - MEDIAWIKI_UPDATE=true
      - MEDIAWIKI_ENABLE_SSL=false
    volumes:
      - /Users/ruan/workspace/docker/mediawiki/mediawiki-data:/data
    ports:
      - 80:80
    depends_on:
      - db
      - memcached

networks:
  mediawiki:
```

Your current working directory in this case: `/Users/ruan/workspace/docker/mediawiki`

Environment Variables for the MySQL Docker image is:

```
- MYSQL_ROOT_PASSWORD
- MYSQL_DATABASE
- MYSQL_USER, MYSQL_PASSWORD
- MYSQL_ALLOW_EMPTY_PASSWORD
- MYSQL_RANDOM_ROOT_PASSWORD
- MYSQL_ONETIME_PASSWORD
```

More info can be viewed on this resource: [hub.docker.com/_/mysql/](https://hub.docker.com/_/mysql/)

## Launching our Mediawiki Application:

Lets deploy mediawiki:

```bash
$ docker-compose up
Creating network "mediawiki_mediawiki" with the default driver
Creating mediawiki_memcached_1_bbbe8d3fa8b3 ... done
Creating mediawiki_db_1_257775fcf65b        ... done
Creating mediawiki_mediawiki_1_56813d66cbe2 ... done
```

## Accessing Mediawiki

You should be able to access Mediawiki on `http://localhost:80/`

## Resources:

- https://github.com/benhutchins/docker-mediawiki
