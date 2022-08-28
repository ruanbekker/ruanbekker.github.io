---
layout: post
title: "Setup the Elasticsearch Log Driver on Docker Swarm"
date: 2018-05-02 15:10:30 -0400
comments: true
categories: ["docker", "docker-swarm", "elasticsearch", "devops"]
---

![](https://user-images.githubusercontent.com/567298/53351889-85572000-392a-11e9-9720-464e9318206e.jpg)

Today we will look at a Elasticsearch logging driver for Docker.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Why a Log Driver?

By default the log output can be retrieved when using the `docker service logs -f service_name`, where log output of that service is shown via stdout. When having a lot of services in your swarm, it becomes useful logging all of your log output to a database service.

This is not just for Swarm but Docker stand alone as well.

In this tutorial we will use the Elasticsearch Log Driver, to log our logs for all our docker swarm services to Elasticsearch.

## Installing to Elasticsearch Log Driver:

If you are running Docker Swarm, run this on all the nodes:

```bash
$ docker plugin install rchicoli/docker-log-elasticsearch:latest --alias elasticsearch_latest
```

Verify that the log driver has been installed:

```bash
$ docker plugin ls
ID                  NAME                          DESCRIPTION                          ENABLED
eadf06ad3d2a        elasticsearch_latest:latest   Send log messages to elasticsearch   true
```

## Test the Log Driver:

Run a container of Alpine and echo a string of text:

```bash
$ docker run --rm -ti \
    --log-driver elasticsearch_latest \
    --log-opt elasticsearch-url=http://192.168.0.235:9200 \
    --log-opt elasticsearch-insecure=false \
    --log-opt elasticsearch-sniff=false \
    --log-opt elasticsearch-index=docker-%F \
    --log-opt elasticsearch-type=log \
    --log-opt elasticsearch-timeout=10 \
    --log-opt elasticsearch-version=5 \
    --log-opt elasticsearch-fields=containerID,containerName,containerImageID,containerImageName,containerCreated \
    --log-opt elasticsearch-bulk-workers=1 \
    --log-opt elasticsearch-bulk-actions=1000 \
    --log-opt elasticsearch-bulk-size=1024 \
    --log-opt elasticsearch-bulk-flush-interval=1s \
    --log-opt elasticsearch-bulk-stats=false \
        alpine echo -n "this is a test logging message"
```

Have a look at your Elasticsearch indexes, and you will find the index which was specified in the log-options:

```bash
$ curl http://192.168.0.235:9200/_cat/indices?v
health status index             uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   docker-2018.05.01 8FTqWq6nQlSGpYjD9M5qSg   5   1          1            0      8.9kb          8.9kb
```

Lets have a look at the Elasticsearch Document which holds the data of the log entry:

```bash
$ curl http://192.168.0.235:9200/docker-2018.05.01/_search?pretty
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "docker-2018.05.01",
        "_type" : "log",
        "_id" : "hMTUG2MBIFc8kAgSNkYo",
        "_score" : 1.0,
        "_source" : {
          "containerID" : "cee0dc758528",
          "containerName" : "jolly_goodall",
          "containerImageID" : "sha256:3fd9065eaf02feaf94d68376da52541925650b81698c53c6824d92ff63f98353",
          "containerImageName" : "alpine",
          "containerCreated" : "2018-05-01T13:11:20.819447101Z",
          "message" : "this is a test logging message",
          "source" : "stdout",
          "timestamp" : "2018-05-01T13:11:21.119861767Z",
          "partial" : true
        }
      }
    ]
  }
}
```

## Using Swarm and Docker Compose:

We will deploy a stack with a whoami golang web app, which will use the elasticsearch log driver:

```bash docker-compose.yml
version: '3.4'

services:
  whoami:
    image: rbekker87/golang-whoami:latest
    networks:
      - appnet
    deploy:
      labels:
        - "traefik.port=80"
        - "traefik.backend.loadbalancer.swarm=true"
        - "traefik.docker.network=appnet"
        - "traefik.frontend.rule=Host:whoami.homecloud.mydomain.com"
      mode: replicated
      replicas: 10
      restart_policy:
        condition: any
      update_config:
        parallelism: 1
        delay: 70s
        order: start-first
        failure_action: rollback
      placement:
        constraints:
          - 'node.role==worker'
      resources:
        limits:
          cpus: '0.01'
          memory: 128M
        reservations:
          cpus: '0.001'
          memory: 64M
    logging:
      driver: elasticsearch_latest
      options:
        elasticsearch-url: "http://192.168.0.235:9200"
        elasticsearch-sniff: "false"
        elasticsearch-index: "docker-whoami-%F"
        elasticsearch-type: "log"
        elasticsearch-timeout: "10"
        elasticsearch-version: "6"
        elasticsearch-fields: "containerID,containerName,containerImageID,containerImageName,containerCreated"
        elasticsearch-bulk-workers: "1"
        elasticsearch-bulk-actions: "1000"
        elasticsearch-bulk-size: "1024"
        elasticsearch-bulk-flush-interval: "1s"
        elasticsearch-bulk-stats: "false"
networks:
  appnet:
    external: true

```

Deploy the Stack:

```bash
$ docker stack deploy -c docker-compose.yml web 
```

Give it some time to launch and have a look at your indexes, and you will find the index which it wrote to:

```bash
$ curl http://192.168.0.235:9200/_cat/indices?v
health status index                     uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   docker-2018.05.01         8FTqWq6nQlSGpYjD9M5qSg   5   1          1            0      8.9kb          8.9kb
yellow open   docker-whoami-2018.05.01  YebUtKa1RnCy86iP5_ylgg   5   1         11            0     54.4kb         54.4kb
```

Having a look at the data:

```
$ curl 'http://192.168.0.235:9200/docker-whoami-2018.05.01/_search?pretty&size=1'
{
  "took" : 18,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 11,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "docker-whoami-2018.05.01",
        "_type" : "log",
        "_id" : "acbgG2MBIFc8kAgShQa7",
        "_score" : 1.0,
        "_source" : {
          "containerID" : "97c3b337735f",
          "containerName" : "web_whoami.6.t2prjiexkym14isbx3yfxa99w",
          "containerImageID" : "sha256:0f7762d2ce569fc2ccf95fbc4c7191dde727551a180253fac046daecc580c7e9",
          "containerImageName" : "rbekker87/golang-whoami:latest@sha256:5a55c5de9cc16fbdda376791c90efb7c704c81b8dba949dce21199945c14cc88",
          "containerCreated" : "2018-05-01T13:24:43.089365528Z",
          "message" : "Starting up on port 80",
          "source" : "stdout",
          "timestamp" : "2018-05-01T13:24:48.636773709Z",
          "partial" : false
        }
      }
    ]
  }
}

```

For more info about this, have a look at the referenced documentation below.

## Resources:

- https://github.com/rchicoli/docker-log-elasticsearch
- https://github.com/moby/moby/issues/25694
- https://docs.docker.com/v17.09/engine/admin/logging/view_container_logs/
- https://sysadmins.co.za/how-to-setup-a-2-node-elasticsearch-cluster-on-centos-7-with-some-example-usage/
