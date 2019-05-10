---
layout: post
title: "Running a HA MySQL Galera Cluster on Docker Swarm"
date: 2019-05-10 07:02:39 -0400
comments: true
categories: ["mysql", "galera", "docker", "swarm", "databases"] 
---

![image](https://user-images.githubusercontent.com/567298/57523982-c904d780-7326-11e9-981a-7a9cb9552c2f.png)

In this post we will setup a highly available mysql galera cluster on docker swarm.

## About

The service is based of [docker-mariadb-cluster](https://github.com/toughIQ/docker-mariadb-cluster) repository and it's designed not to have any persistent data attached to the service, but rely on the "nodes" to replicate the data.

Note, that however this proof of concept works, I always recommend to use a remote mysql database outside your cluster, such as RDS etc.

Since we don't persist any data on the mysql cluster, I have associated a dbclient service that will run continious backups, which we will persist the path where the backups reside to disk.

## Deploy the MySQL Cluster

The [docker-compose.yml](https://raw.githubusercontent.com/ruanbekker/dockerfiles/master/mysql-cluster/docker-compose.yml) that we will use looks like this:

```yaml
version: '3.5'
services:
  dbclient:
    image: alpine
    environment:
      - BACKUP_ENABLED=1
      - BACKUP_INTERVAL=3600
      - BACKUP_PATH=/data
      - BACKUP_FILENAME=db_backup
    networks:
      - dbnet
    entrypoint: |
      sh -c 'sh -s << EOF
      apk add --no-cache mysql-client
      while true
        do
          if [ $$BACKUP_ENABLED == 1 ]
            then
              sleep $$BACKUP_INTERVAL
              mkdir -p $$BACKUP_PATH/$$(date +%F)
              echo "$$(date +%FT%H.%m) - Making Backup to : $$BACKUP_PATH/$$(date +%F)/$$BACKUP_FILENAME-$$(date +%FT%H.%m).sql.gz"
              mysqldump -u root -ppassword -h dblb --all-databases | gzip > $$BACKUP_PATH/$$(date +%F)/$$BACKUP_FILENAME-$$(date +%FT%H.%m).sql.gz
              find $$BACKUP_PATH -mtime 7 -delete
          fi
        done
      EOF'
    volumes:
      - vol_dbclient:/data
    deploy:
      mode: replicated
      replicas: 1

  dbcluster:
    image: toughiq/mariadb-cluster
    networks:
      - dbnet
    environment:
      - DB_SERVICE_NAME=dbcluster
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=mydb
      - MYSQL_USER=mydbuser
      - MYSQL_PASSWORD=mydbpass
    deploy:
      mode: replicated
      replicas: 1

  dblb:
    image: toughiq/maxscale
    networks:
      - dbnet
    ports:
      - 3306:3306
    environment:
      - DB_SERVICE_NAME=dbcluster
      - ENABLE_ROOT_USER=1
    deploy:
      mode: replicated
      replicas: 1

volumes:
  vol_dbclient:
    driver: local

networks:
  dbnet:
    name: dbnet
    driver: overlay
```

The dbclient is configured to be in the same network as the cluster so it can reach the mysql service. The default behavior is that it will make a backup every hour (3600 seconds) to the `/data/{date}/` path.

Deploy the stack:

```
$ docker stack deploy -c docker-compose.yml galera
Creating network dbnet
Creating service galera_dbcluster
Creating service galera_dblb
Creating service galera_dbclient
```

Have a look to see if all the services is running:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                            PORTS
jm7p70qre72u        galera_dbclient     replicated          1/1                 alpine:latest
p8kcr5y7szte        galera_dbcluster    replicated          1/1                 toughiq/mariadb-cluster:latest
1hu3oxhujgfm        galera_dblb         replicated          1/1                 toughiq/maxscale:latest          :3306->3306/tcp
```

## The Backup Client

As mentioned the backup client backs up to the `/data/` path:

```
$ docker exec -it $(docker ps -f name=galera_dbclient -q) find /data/
/data/
/data/2019-05-10
/data/2019-05-10/db_backup-2019-05-10T10.05.sql.gz
```

Let's go ahead and populate some data into our mysql database:

```
$ docker exec -it $(docker ps -f name=galera_dbclient -q) mysql -uroot -ppassword -h dblb
MySQL [(none)]> create table mydb.foo (name varchar(10));
MySQL [(none)]> insert into mydb.foo values('ruan');
MySQL [(none)]> exit
```

## Scale the Cluster

At the moment we only have 1 replica for our mysql cluster, let's go ahead and scale the cluster to 3 replicas:

```
$ docker service scale galera_dbcluster=3
galera_dbcluster scaled to 3
overall progress: 3 out of 3 tasks
1/3: running   [==================================================>]
2/3: running   [==================================================>]
3/3: running   [==================================================>]
verify: Service converged
```

Verify that the service has been scaled:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                            PORTS
jm7p70qre72u        galera_dbclient     replicated          1/1                 alpine:latest
p8kcr5y7szte        galera_dbcluster    replicated          3/3                 toughiq/mariadb-cluster:latest
1hu3oxhujgfm        galera_dblb         replicated          1/1                 toughiq/maxscale:latest          :3306->3306/tcp
```

Test, by reading from the database:

```
$ docker exec -it $(docker ps -f name=galera_dbclient -q) mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
+------+
| name |
+------+
| ruan |
+------+
```

## Simulate a Node Failure:

Simulate a node failure by killing one of the mysql containers:

```
$ docker kill 9e336032ab52
```

Verify that one container is missing from our service:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                            PORTS
p8kcr5y7szte        galera_dbcluster    replicated          2/3                 toughiq/mariadb-cluster:latest
```

While the container is provisioning, as we have 2 out of 3 running containers, read the data 3 times so test that the round robin queries dont hit the affected container (the dblb wont route traffic to the affected container):

```
$ docker exec -it $(docker ps -f name=galera_dbclient -q) mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
+------+
| name |
+------+
| ruan |
+------+

$ docker exec -it $(docker ps -f name=galera_dbclient -q) mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
+------+
| name |
+------+
| ruan |
+------+

$ docker exec -it $(docker ps -f name=galera_dbclient -q) mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
+------+
| name |
+------+
| ruan |
+------+
```

Verify that the 3rd container has checked in:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                            PORTS
p8kcr5y7szte        galera_dbcluster    replicated          3/3                 toughiq/mariadb-cluster:latest
```

## How to Restore?

I'm deleting the database to simulate the scenario where we need to restore:

```
$ docker exec -it $(docker ps -f name=galera_dbclient -q) sh
> mysql -uroot -ppassword -h dblb -e'drop database mydb;'
```

Ensure the db is not present:

```
> mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
ERROR 1146 (42S02) at line 1: Table 'mydb.foo' doesn't exist
```

Find the archive and extract:

```
> find /data/
/data/
/data/2019-05-10
/data/2019-05-10/db_backup-2019-05-10T10.05.sql.gz

> gunzip /data/2019-05-10/db_backup-2019-05-10T10.05.sql.gz
```

Restore the backed up database to MySQL:

```
> mysql -uroot -ppassword -h dblb < /data/2019-05-10/db_backup-2019-05-10T10.05.sql
```

Test that we can read our data:

```
> mysql -uroot -ppassword -h dblb -e'select * from mydb.foo;'
+------+
| name |
+------+
| ruan |
+------+
```
