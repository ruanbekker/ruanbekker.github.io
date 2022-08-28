---
layout: post
title: "Use Swarm Managed Configs in Docker Swarm to store your Application Configs"
date: 2019-02-28 09:48:28 -0500
comments: true
categories: ["docker", "swarm", "configs"] 
---

![](https://user-images.githubusercontent.com/567298/53351889-85572000-392a-11e9-9720-464e9318206e.jpg)

Docker version 17.06 introduced Swarm Service Configs, which allows you to store data like configuration files, note that this is for non-sensitive information.

In this tutorial we will store the data of our `index.html` in a service config, then attach the config to our service.

## Creating the Config

Create the `index.html` file and store it as a config:

```bash
$ cat > index.html << EOF
<html>
  <body>
    Hello, World!
  </body>
</html>
EOF
```

Store the config as `nginx_root_doc`:

```bash
$ docker config create nginx_root_doc index.html
```

## Create the Service

Create the swarm service and associate the config with the service and set the target path where the config will reside:

```bash
$ docker service create --name web \
  --config source=nginx_root_doc,target=/usr/share/nginx/html/index.html \
  --publish 8080:80 nginx:alpine
```

Once the service is up, test it:

```bash
$ curl -i http://localhost:8080/
<html>
HTTP/1.1 200 OK
Server: nginx/1.15.9
Date: Thu, 28 Feb 2019 12:00:19 GMT
Content-Type: text/html
Content-Length: 52
Last-Modified: Thu, 28 Feb 2019 11:59:37 GMT
Connection: keep-alive
ETag: "5c77cd29-34"
Accept-Ranges: bytes

<html>
  <body>
    Hello, World!
  </body>
</html>
```

Delete the service:

```bash
$ docker service rm web
```

Delete the config:

```bash
$ docker config rm nginx_root_doc
```

## Create the Service using Compose:

Doing the same with a docker-compose file, will look like the following. The first example will be where we will explicitly define our path of our secret, and will create on deploy time. Our compose file:

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - 8080:80
    networks:
      - net
    configs:
      - source: nginx_root_doc
        target: /usr/share/nginx/html/index.html

configs:
  nginx_root_doc:
    file: ./index.html

networks:
  net:
    driver: overlay
```

Deploying our stack:

```bash
$ docker stack deploy -c docker-compose.yml apps
Creating network apps_net
Creating config apps_nginx_root_doc
Creating service apps_web
```

Testing our our service:

```bash
$ curl -i http://localhost:8080/
HTTP/1.1 200 OK
Server: nginx/1.15.9
Date: Thu, 28 Feb 2019 12:20:52 GMT
Content-Type: text/html
Content-Length: 56
Last-Modified: Thu, 28 Feb 2019 12:20:47 GMT
Connection: keep-alive
ETag: "5c77d21f-38"
Accept-Ranges: bytes

<html>
  <body>
    Hello, World!
  </body>
</html>
```

Note, that configs cant be updated, if you want to rotate a config you will create a new config and update the target in your task definition to point to your new config.

Delete the stack:

```bash
$ docker stack rm apps
Removing service apps_web
Removing config apps_nginx_root_doc
Removing network apps_net
```

Another example will be to point to a external config which already exists in swarm. The only change will be that we need to set the config as a external type.

Create the config:

```bash
$ docker config create nginx_root_doc index.html
```

Now that the config exists, create this compose file:

```yaml
version: "3.3"

services:
  web:
    image: nginx:alpine
    ports:
      - 8080:80
    networks:
      - net
    configs:
      - source: nginx_root_doc
        target: /usr/share/nginx/html/index.html

configs:
  nginx_root_doc:
    external: true

networks:
  net:
    driver: overlay
```

Then deploy the stack:

```bash
$ docker stack deploy -c docker-compose.yml apps
Creating network apps_net
Creating service apps_web
```

Then testing:

```bash
$ curl -i http://localhost:8080/
HTTP/1.1 200 OK
Server: nginx/1.15.9
Date: Thu, 28 Feb 2019 12:28:11 GMT
Content-Type: text/html
Content-Length: 56
Last-Modified: Thu, 28 Feb 2019 12:28:09 GMT
Connection: keep-alive
ETag: "5c77d3d9-38"
Accept-Ranges: bytes

<html>
  <body>
    Hello, World!
  </body>
</html>
```

## Resources:

For more information on docker swarm configs have a look at [docker's documentation](https://docs.docker.com/engine/swarm/configs/#example-rotate-a-config)
