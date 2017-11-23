---
layout: post
title: "Use Docker Secrets with MySQL on Docker Swarm"
date: 2017-11-23 16:55:15 -0500
comments: true
categories: ["docker", "docker-swarm", "docker-secrets", "docker-compose", "mysql"] 
---

Today we will use Docker Secrets, more specifically store our MySQL Passwords in Secrets, which will be passed to our containers, so that we don't use clear text passwords in our Compose files.

## What is Docker Secrets:

In Docker, Docker Secrets are encrypted during transit and at rest in a Docker Swarm Cluster. The great thing about Docker Secrets is that you can manage these secrets from a central place, and the fact that it encrypts the data and transfers the data securely to the containers that needs the secrets. So you authorize which containers needs access to these secrets.

So instead of setting the MySQL Root Passwords in clear text, you will create the secrets, then in your docker-compose file, you will reference the secret name.

## Deploy MySQL with Docker Secrets

We will deploy a Stack that contains MySQL and Adminer (WebUI for MySQL).

We will make the MySQL Service Persistent by setting a constraint to only run on the Manager node, as we will create the volume path on the host, and then map the host to the container so that the container can have persistent data. We will also create secrets for our MySQL Service so that we dont expose any plaintext passwords in our compose file.

Our Docker Compose file:

```yaml docker-compose.yml
version: '3.3'

services:
  db:
    image: mysql
    secrets:
      - db_root_password
      - db_dba_password
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
      resources:
        reservations:
          memory: 128M
        limits:
          memory: 256M
    ports:
      - 3306:3306
    environment:
      MYSQL_USER: dba
      MYSQL_DATABASE: mydb
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_root_password
      MYSQL_PASSWORD_FILE: /run/secrets/db_dba_password
    networks:
      - appnet
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - type: bind
        source: /opt/docker/volumes/mysql
        target: /var/lib/mysql

  adminer:
    image: adminer
    ports:
      - 8080:8080
    networks:
      - appnet

secrets:
  db_root_password:
    external: true
  db_dba_password:
    external: true

networks:
  appnet:
    external: true
```

## Dependencies:

As we specified our secrets and networks as external resources, it needs to exist before we deploy our stack. We also need to create the directory for our mysql data, as the data will be mapped from our host to our container.

Create the Overlay Network:

```bash
$ docker network create --driver overlay appnet
```

Create the Secrets:

```bash
$ openssl rand -base64 12 | docker secret create db_root_password -
$ openssl rand -base64 12 | docker secret create db_dba_password -
```

List the Secrets:

```bash
$ docker secret ls
ID                          NAME                CREATED             UPDATED
jzhrwyxkiqt8v81ow0xjktqnw   db_root_password    12 seconds ago      12 seconds ago
plr6rbrqkqy7oplrd21pja3ol   db_dba_password     4 seconds ago       4 seconds ago
```

Inspect the secret, so that we can see that theres not value exposed:

```bash
$ docker secret inspect db_root_password
[
    {
        "ID": "jzhrwyxkiqt8v81ow0xjktqnw",
        "Version": {
            "Index": 982811
        },
        "CreatedAt": "2017-11-23T14:33:17.005968748Z",
        "UpdatedAt": "2017-11-23T14:33:17.005968748Z",
        "Spec": {
            "Name": "db_root_password",
            "Labels": {}
        }
    }
]
```

Create the Directory for MySQL:

```bash
$ mkdir -p /opt/docker/volumes/mysql
```

## Deployment Time!

Deploy the stack:

```
$ docker stack deploy -c docker-compose.yml apps
Creating service apps_adminer
Creating service apps_db
```

As you can see the data of our MySQL container resides on our host, which makes the data persistent for the container:

```bash
$ ls /opt/docker/volumes/mysql/
auto.cnf  ca-key.pem  ca.pem  client-cert.pem  client-key.pem  ib_buffer_pool  ibdata1  ib_logfile0  ib_logfile1  ibtmp1  mydb  mysql  performance_schema  private_key.pem  public_key.pem  server-cert.pem  server-key.pem  sys
```

## Connect to MySQL

The value of our secrets will reside under `/run/secrets/` in our container, as we have mapped it to our mysql container, lets have a look at them:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) ls /run/secrets/
db_dba_password  db_root_password
```

View the actual value of the `db_root_password`:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) cat /run/secrets/db_root_password
mRpcY1eY2+wimf10
```

Connecting to MySQL:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) mysql -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 5.7.20 MySQL Community Server (GPL)

Copyright (c) 2000, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mydb               |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
```

As we have deployed adminer, you can access the Adminer WebUI on the Host's IP and the Defined Port.

## Testing Data Persistance:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) mysql -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.

mysql> create database ruan;
Query OK, 1 row affected (0.00 sec)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mydb               |
| mysql              |
| performance_schema |
| ruan               |
| sys                |
+--------------------+
6 rows in set (0.00 sec)

mysql> exit;
Bye
```

Verify the hostname of our container, before we kill the container:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) hostname
bdedb54bbc2b
```

Kill the container:

```
$ docker kill $(docker ps -f name=apps_db -q)
bdedb54bbc2b
```

Verify the status of the MySQL Service, as we can see the service count is 0, so the container was succesfully killed.

```bash
$ docker service ls -f name=apps_db
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
nzf96q05fktm        apps_db             replicated          0/1                 mysql:latest        *:3306->3306/tcp
```

After waiting for a couple of seconds, we can see the service is in service again, then check the hostname so that we can confirm that its a new container:

```
$ docker service ls -f name=apps_db
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
nzf96q05fktm        apps_db             replicated          1/1                 mysql:latest        *:3306->3306/tcp

$ docker exec -it $(docker ps -f name=apps_db -q) hostname
95c15c89f891
```

Logong to MySQL again and verify if our perviously created database is still there:

```bash
$ docker exec -it $(docker ps -f name=apps_db -q) mysql -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mydb               |
| mysql              |
| performance_schema |
| ruan               |
| sys                |
+--------------------+
6 rows in set (0.01 sec)
```

By design docker is stateless, but as we mapped the host's path to the container our data is persistent. As we have set a constraint so that the container must only spin up on this node, the container will always have access to the data path.
