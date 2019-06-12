---
layout: post
title: "Running a 3 Node Elasticsearch Cluster with Docker Compose on your Laptop for testing"
date: 2018-04-29 13:43:35 -0400
comments: true
categories: ["docker", "elasticsearch", "docker-compose", "kibana", "development"]
---

Having a Elasticsearch cluster on your laptop with Docker for testing is great. And in this post I will show you how quick and easy it is, to have a 3 node elasticsearch cluster running on docker for testing.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Pre-Requisites

We need to set the `vm.max_map_count` kernel parameter:

```bash
$ sudo sysctl -w vm.max_map_count=262144
```

To set this permanently, add it to `/etc/sysctl.conf` and reload with `sudo sysctl -p`

## Docker Compose:

The docker compose file that we will reference:

<script src="https://gist.github.com/ruanbekker/410538a0e38c3df5c3ba76e7171f2eda.js"></script>

The data of our elasticsearch container volumes will reside under /var/lib/docker, if you want them to persist in another location, you can use the `driver_opts` setting for the local volume driver.

## Deploy

Deploy your elasticsearch cluster with docker compose:

```
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

Update (2019.06) - I am preparing a full elasticsearch course available on [https://github.com/ruanbekker/elasticsearch-demo](https://github.com/ruanbekker/elasticsearch-demo) and a [Elasticsearch Cheetsheat](https://gist.github.com/ruanbekker/e8a09604b14f37e8d2f743a87b930f93), feel free to check it out.

