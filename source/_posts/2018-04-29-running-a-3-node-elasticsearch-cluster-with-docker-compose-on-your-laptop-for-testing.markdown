---
layout: post
title: "Running a 3 Node Elasticsearch Cluster with Docker Compose on your Laptop for testing"
date: 2018-04-29 13:43:35 -0400
comments: true
categories: ["docker", "elasticsearch", "docker-compose", "kibana", "development"]
---

Having a Elasticsearch cluster on your laptop with Docker for testing is great. And in this post I will show you how quick and easy it is, to have a 3 node elasticsearch cluster running on docker for testing.

## Pre-Requisites

We need to set the `vm.max_map_count` kernel parameter:

```bash
$ sudo sysctl -w vm.max_map_count=262144
```

To set this permanently, add it to `/etc/sysctl.conf` and reload with `sudo sysctl -p`

## Docker Compose:

The docker compose file that we will reference:

```yaml
version: '2.2'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.4
    container_name: elasticsearch
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - http.cors.enabled=true
      - http.cors.allow-origin=*
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata1:/home/ruan/workspace/docker/elasticsearch/data
    ports:
      - 9200:9200
    networks:
      - esnet
  elasticsearch2:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.4
    container_name: elasticsearch2
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - http.cors.enabled=true
      - http.cors.allow-origin=*
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - "discovery.zen.ping.unicast.hosts=elasticsearch"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata2:/home/ruan/workspace/docker/elasticsearch/data
    networks:
      - esnet
  elasticsearch3:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.4
    container_name: elasticsearch3
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - http.cors.enabled=true
      - http.cors.allow-origin=*
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - "discovery.zen.ping.unicast.hosts=elasticsearch"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata3:/home/ruan/workspace/docker/elasticsearch/data
    networks:
      - esnet

  kibana:
    image: 'docker.elastic.co/kibana/kibana:6.3.2'
    container_name: kibana
    environment:
      SERVER_NAME: kibana.local
      ELASTICSEARCH_URL: http://elasticsearch:9200
    ports:
      - '5601:5601'
    networks:
      - esnet
 
  headPlugin:
    image: 'mobz/elasticsearch-head:5'
    container_name: head
    ports:
      - '9100:9100'
    networks:
      - esnet

volumes:
  esdata1:
    driver: local
  esdata2:
    driver: local
  esdata3:
    driver: local

networks:
  esnet:

```

Now make sure the paths exist that we referenced in the compose file, in my case `/home/ruan/workspace/docker/elasticsearch/data`

## Deploy

Deploy your elasticsearch cluster with docker compose:

```bash
$ docker-compose up
```

This will run in the foreground, and you should see console output.

## Testing Elasticsearch

Let's run a couple of queries, first up, check the cluster health api:

```bash
$ curl http://127.0.0.1:9200/_cluster/health?pretty
{
  "cluster_name" : "docker-cluster",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 3,
  "number_of_data_nodes" : 3,
  "active_primary_shards" : 1,
  "active_shards" : 2,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

Create a index with replication count of 2:

```bash
$ curl -H "Content-Type: application/json" -XPUT http://127.0.0.1:9200/test -d '{"number_of_replicas": 2}'
```

Ingest a document to elasticsearch:

```bash
$ curl -H "Content-Type: application/json" -XPUT http://127.0.0.1:9200/test/docs/1 -d '{"name": "ruan"}'
{"_index":"test","_type":"docs","_id":"1","_version":1,"result":"created","_shards":{"total":3,"successful":3,"failed":0},"_seq_no":0,"_primary_term":1}
```

View the indices:

```bash
$ curl http://127.0.0.1:9200/_cat/indices?v
health status index                       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   test                        w4p2Q3fTR4uMSYBfpNVPqw   5   2          1            0      3.3kb          1.1kb
green  open   .monitoring-es-6-2018.04.29 W69lql-rSbORVfHZrj4vug   1   1       1601           38        4mb            2mb
```

## Kibana

Kibana is also included in the stack and is accessible via http://localhost:5601/ and you it should look more or less like:

![](https://objects.ruanbekker.com/assets/images/kibana-local-home.png)

## Elasticsearch Head UI

I always prefer working directly with the RESTFul API, but if you would like to use a UI to interact with Elasticsearch, you can access it via http://localhost:9100/ and should look like this:

![](https://objects.ruanbekker.com/assets/images/elasticsearch-head-ui.png)

## Deleting the Cluster:

As its running in the foreground, you can just hit ctrl + c and as we persisted data in our compose, when you spin up the cluster again, the data will still be there.

## Resources:

- https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html
