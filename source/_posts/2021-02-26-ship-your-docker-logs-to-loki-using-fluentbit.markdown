---
layout: post
title: "Ship your Docker Logs to Loki using Fluentbit"
date: 2021-02-26 15:26:34 -0500
comments: true
categories: ["logging", "docker", "loki", "fluentbit"] 
---

In this tutorial, I will show you how to ship your docker containers logs to [Grafana Loki](https://grafana.com/oss/loki/) via [Fluent Bit](https://fluentbit.io/).

## Grafana and Loki

First we need to get Grafana and Loki up and running and we will be using docker and docker-compose to do that. 

Our `docker-compose-loki.yml`:

```
version: "3.7"

services:
  grafana:
    image: grafana/grafana:7.4.2
    container_name: 'grafana'
    restart: unless-stopped
    volumes:
      - ./data/grafana/data:/var/lib/grafana
      - ./configs/grafana/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
    networks:
      - public
    ports:
      - 3000:3000
    depends_on:
      - loki
    logging:
      driver: "json-file"
      options:
        max-size: "1m"  
  
  loki:
    image: grafana/loki:2.1.0
    container_name: loki
    command: -config.file=/mnt/loki-local-config.yaml
    user: root
    restart: unless-stopped
    volumes:
      - ./data/loki/data:/tmp/loki
      - ./configs/loki/loki.yml:/mnt/loki-local-config.yaml
    ports:
      - 3100:3100
    networks:
      - public
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

networks:
  public:
    name: public
```

We are referencing 2 config files, first our loki datasource defined by `./configs/grafana/datasource.yml`:

```
apiVersion: 1

datasources:
- name: loki
  type: loki
  access: proxy
  orgId: 1
  url: http://loki:3100
  basicAuth: false
  isDefault: true
  version: 1
  editable: true
```

And our second config is our loki config `./configs/loki/loki.yml`:

```
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2018-04-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index

  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

Once you have everything in place, boot the grafana and loki containers:

```
$ docker-compose -f docker-compose-loki.yml up -d
```

## Fluent Bit

Next we need to boot our log processor and forwarder, fluent bit. In our `docker-compose-fluentbit.yml`:

```
version: "3.7"

services:
  fluent-bit:
    image: grafana/fluent-bit-plugin-loki:latest
    container_name: fluent-bit
    environment:
      - LOKI_URL=http://loki:3100/loki/api/v1/push
    volumes:
      - ./fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf
    ports:
      - "24224:24224"
      - "24224:24224/udp"
    networks:
      - public

networks:
  public:
    name: public
```

And as you can see we are referencing a config `./configs/fluentbit/fluent-bit.conf`:

```
[INPUT]
    Name        forward
    Listen      0.0.0.0
    Port        24224
[Output]
    Name grafana-loki
    Match *
    Url ${LOKI_URL}
    RemoveKeys source,container_id
    Labels {job="fluent-bit"}
    LabelKeys container_name
    BatchWait 1s
    BatchSize 1001024
    LineFormat json
    LogLevel info
```

Once you have your configs in place, boot fluent-bit:

```
$ docker-compose -f docker-compose-fluentbit.yml up -d
```

## Nginx App

Now to configure our docker container to ship its logs to fluent-bit, which will forward the logs to Loki.

In our `docker-compose-app.yml`:

```
version: "3"

services:
  nginx-json:
    image: ruanbekker/nginx-demo:json
    container_name: nginx-app
    ports:
      - 8080:80
    logging:
      driver: fluentd
      options:
        fluentd-address: 127.0.0.1:24224
```

The fluent-bit container listens on port 24224 locally on our docker host and is not reachable via its container network, so let's boot our application:

```
$ docker-compose -f docker-compose-app.yml up -d
```

Once our application is up, let's make a request to our nginx-app:

```
$ curl http://localhost:8080/
ok
```

Now head over to Grafana at http://localhost:3000/explore and query: `{job="fluent-bit", container_name="/nginx-app"}` and you should see something like this:

![image](https://user-images.githubusercontent.com/567298/109366000-03908900-789b-11eb-952e-36ff23657517.png)

Beautiful right? I know.

## Github Repo

The source code for this can be found on:

- https://github.com/ruanbekker/docker-logging-loki-fuentbit
