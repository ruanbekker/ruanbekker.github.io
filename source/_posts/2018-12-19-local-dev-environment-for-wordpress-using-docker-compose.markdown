---
layout: post
title: "Local Dev Environment for Wordpress using Docker Compose"
date: 2018-12-19 08:33:44 -0500
comments: true
categories: ["docker", "wordpress", "dev-environment", "mysql"] 
---

Let's setup a local development environment with Docker, Wordpress, MySQL using Docker Compose

## Docker Compose File

Let's look at our docker-compose.yml file:

```yaml
version: '3.1'

services:

  wordpress:
    image: wordpress
    restart: always
    ports:
      - 8080:80
    environment:
      - WORDPRESS_DB_NAME=wordpress
      - WORDPRESS_DB_HOST=mysql
      - WORDPRESS_DB_USER=wordpress
      - WORDPRESS_DB_PASSWORD=wordpress
    networks:
      - wordpress

  mysql:
    image: mysql:5.7
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=wordpress
      - MYSQL_USER=wordpress
      - MYSQL_PASSWORD=wordpress
    networks:
      - wordpress

networks:
  wordpress:
```

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

## Launching our Wordpress Application:

Lets deploy wordpress:

```bash
$ docker-compose up 
Creating network "wordpress_wordpress" with the default driver
Creating wordpress_mysql_1_3e6e3cfe07b1     ... done
Creating wordpress_wordpress_1_a9cb16f277af ... done
Attaching to wordpress_wordpress_1_9227f3d3e587, wordpress_mysql_1_65cc98d222d0
```

## Accessing Wordpress

You should be able to access Wordpress on `http://localhost:80/`


