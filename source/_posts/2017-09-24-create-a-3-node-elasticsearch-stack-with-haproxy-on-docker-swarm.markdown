---
layout: post
title: "Create a 3 Node Elasticsearch Stack with HAProxy on Docker Swarm"
date: 2017-09-24 15:40:19 -0400
comments: true
categories: ["docker", "swarm", "docker-compose", "docker-stacks", "haproxy", "elasticsearch"] 
---

Tried out creating a 3 node elasticsearch stack on docker swarm using docker-compose, that sits behind a haproxy service.

## Environment:

Images:

- [dockercloud/haproxy](https://hub.docker.com/r/dockercloud/haproxy/)
- [rbekker87/elasticsearch:master-5.6-alpine](https://github.com/ruanbekker/docker-elasticsearch)

Stack:

- 1 x haproxy
- 1 x elasticsearch master (haproxy wont send requests to this one)
- 2 x elasticsearch master/data 
- 1 x esnet overlay network

## Defining our Stack

First we will create our compose file, which we will call `es-compose.yml`:

```yaml
version: '3'

services:
  es-master:
    image: rbekker87/elasticsearch:master-5.6-alpine
    networks:
      - esnet
    deploy:
      replicas: 1

  es-data-1:
    image: rbekker87/elasticsearch:master-5.6-alpine
    environment:
     - SERVICE_PORTS=9200
    networks:
      - esnet
    deploy:
      replicas: 2

  es-data-2:
    image: rbekker87/elasticsearch:master-5.6-alpine
    environment:
     - SERVICE_PORTS=9200
    networks:
      - esnet
    deploy:
      replicas: 2

  loadbalancer:
    image: dockercloud/haproxy:latest
    depends_on:
      - es-data-1
      - es-data-2
    environment:
      - BALANCE=leastconn
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 9200:80
    networks:
      - esnet
    deploy:
      placement:
        constraints: [node.role == manager]

networks:
  esnet:
    driver: overlay
```

The above compose file defines that we want a overlay network, which we will associate with all our services, 3 elasticsearch services, haproxy service which will expose port 9200, then from haproxy it has a container port of 80, which sends to the backend `SERVICE_PORTS` of each elasticsearch service.

We have only defined `SERVICE_PORTS=9200` on our es-data services, as I just want to proxy client connections to them.

## Creating our Elasticsearch Stack

Now that we have our compose file ready, let's create our stack using `docker stack deploy`:

```bash Create the Stack
$ docker stack deploy -c es-compose.yml analytics

Creating network analytics_esnet
Creating service analytics_loadbalancer
Creating service analytics_es-master
Creating service analytics_es-data-1
Creating service analytics_es-data-2
```

Let's have a look at our stack:

```bash Docker Stack Status 
$ docker stack ps analytics
ID                  NAME                       IMAGE                                       NODE                  DESIRED STATE       CURRENT STATE            ERROR               PORTS
4t3ukxl2kch3        analytics_loadbalancer.1   dockercloud/haproxy:latest                  scw-swarm-master-01   Running             Running 27 seconds ago
jgbxtgqkg9jp        analytics_es-data-2.1      rbekker87/elasticsearch:master-5.6-alpine   scw-swarm-master-01   Running             Running 33 seconds ago
x5cq6pm7u7mn        analytics_es-data-1.1      rbekker87/elasticsearch:master-5.6-alpine   scw-swarm-master-01   Running             Running 36 seconds ago
5v22w1hvtdvm        analytics_es-master.1      rbekker87/elasticsearch:master-5.6-alpine   scw-swarm-master-01   Running             Running 38 seconds ago
```

View the logs of our haproxy service:

```bash HAProxy Service Logs
$ docker service logs -f analytics_loadbalancer
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:dockercloud/haproxy 1.6.7 is running outside Docker Cloud
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:Haproxy is running in SwarmMode, loading HAProxy definition through docker api
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:dockercloud/haproxy PID: 7
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:=> Add task: Initial start - Swarm Mode
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:=> Executing task: Initial start - Swarm Mode
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:==========BEGIN==========
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:Linked service: analytics_es-data-1, analytics_es-data-2, analytics_es-master
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:Linked container: analytics_es-data-1.1.u641c5bq5vkjklk8sb1scnnlc, analytics_es-data-2.1.ic9an6bzj6aejs0lx0vzfpia6, analytics_es-master.1.h4erlgwzit509p0zehzmozy3u
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:HAProxy configuration:
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | global
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   log 127.0.0.1 local0
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   log 127.0.0.1 local1 notice
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   log-send-hostname
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   maxconn 4096
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   pidfile /var/run/haproxy.pid
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   user haproxy
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   group haproxy
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   daemon
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats socket /var/run/haproxy.stats level admin
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   ssl-default-bind-options no-sslv3
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   ssl-default-bind-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:AES128-GCM-SHA256:AES128-SHA256:AES128-SHA:AES256-GCM-SHA384:AES256-SHA256:AES256-SHA:DHE-DSS-AES128-SHA:DES-CBC3-SHA
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | defaults
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   balance leastconn
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   log global
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   mode http
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   option redispatch
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   option httplog
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   option dontlognull
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   option forwardfor
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout connect 5000
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout client 50000
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout server 50000
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | listen stats
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   bind :1936
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   mode http
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats enable
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout connect 10s
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout client 1m
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   timeout server 1m
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats hide-version
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats realm Haproxy\ Statistics
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats uri /
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   stats auth stats:stats
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | frontend default_port_80
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   bind :80
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   reqadd X-Forwarded-Proto:\ http
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   maxconn 4096
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   default_backend default_service
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | backend default_service
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   server analytics_es-data-1.1.u641c5bq5vkjklk8sb1scnnlc 10.0.7.5:9200 check inter 2000 rise 2 fall 3
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    |   server analytics_es-data-2.1.ic9an6bzj6aejs0lx0vzfpia6 10.0.7.7:9200 check inter 2000 rise 2 fall 3
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:Launching HAProxy
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:HAProxy has been launched(PID: 10)
analytics_loadbalancer.1.lcpgiz0ooeas@scw-swarm-master-01    | INFO:haproxy:===========END===========
```

## Testing Elasticsearch:

Do a GET request on our HAProxy's Expose port: 9200

```bash Test Elasticsearch on port 9200
$ curl -XGET http://127.0.0.1:9200
{
  "name" : "5306a0c2ee24",
  "cluster_name" : "es-cluster",
  "cluster_uuid" : "FUJmMekFQVq6zXofPCin2A",
  "version" : {
    "number" : "5.6.0",
    "build_hash" : "781a835",
    "build_date" : "2017-09-07T03:09:58.087Z",
    "build_snapshot" : false,
    "lucene_version" : "6.6.0"
  },
  "tagline" : "You Know, for Search"
}
```

Have a look at the `/_cat/nodes` API:

```bash Get the Node Info
$  curl -XGET http://127.0.0.1:9200/_cat/nodes?v
ip       heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.0.7.6           28          84  14    3.09    2.28     1.49 mdi       -      56c1b0aebc5f
10.0.7.2           27          84  15    3.09    2.28     1.49 mdi       *      572c68bca904
10.0.7.4           29          84  15    3.09    2.28     1.49 mdi       -      5306a0c2ee24
```
