---
layout: post
title: "Logging with Docker Promtail and Grafana Loki"
date: 2022-11-18 00:42:49 -0500
comments: true
categories: ["docker", "grafana", "loki", "promtail"]
redirect: true
---

![grafana-loki-promtail](https://user-images.githubusercontent.com/567298/202631247-4ee94f01-b34a-471f-b428-6aba80b31e8c.png)

In this post we will use Grafana Promtail to collect all our logs and ship it to Grafana Loki.

## About

We will be using Docker Compose and mount the docker socket to Grafana Promtail so that it is aware of all the docker events and configure it that only containers with docker labels `logging=promtail` needs to be enabled for logging, which will then scrape those logs and send it to Grafana Loki where we will visualize it in Grafana.

## Promtail

In our promtail configuration `config/promtail.yaml`:

```yaml
# https://grafana.com/docs/loki/latest/clients/promtail/configuration/
# https://docs.docker.com/engine/api/v1.41/#operation/ContainerList
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: flog_scrape 
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
        filters:
          - name: label
            values: ["logging=promtail"] 
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'logstream'
      - source_labels: ['__meta_docker_container_label_logging_jobname']
        target_label: 'job'
```

You can see we are using the `docker_sd_configs` provider and filter only docker containers with the docker labels `logging=promtail` and once we have those logs we relabel our labels to have the container name and we also use docker labels like `log_stream` and `logging_jobname` to add labels to our logs.

## Grafana Config

We would like to auto configure our datasources for Grafana and in `config/grafana-datasources.yml` we have:

```yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    version: 1
    editable: false
    isDefault: true
```

## Docker Compose

Then lastly we have our `docker-compose.yml` that wire up all our containers:

```yaml
version: '3.8'

services:
  nginx-app:
    container_name: nginx-app
    image: nginx
    labels:
      logging: "promtail"
      logging_jobname: "containerlogs"
    ports:
      - 8080:80
    networks:
      - app

  grafana:
    image: grafana/grafana:latest
    ports:
      - 3000:3000
    volumes:
      - ./config/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yaml
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_AUTH_DISABLE_LOGIN_FORM=true
    networks:
      - app

  loki:
    image: grafana/loki:latest
    ports:
      - 3100:3100
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - app

  promtail:
    image:  grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./config/promtail.yaml:/etc/promtail/docker-config.yaml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
    command: -config.file=/etc/promtail/docker-config.yaml
    depends_on:
      - loki
    networks:
      - app

networks:
  app:
    name: app
```

As you can see with our nginx container we define our labels:

```yaml
  nginx-app:
    container_name: nginx-app
    image: nginx
    labels:
      logging: "promtail"
      logging_jobname: "containerlogs"
```

Which uses `logging: "promtail"` to let promtail know this log container's log to be scraped and `logging_jobname: "containerlogs"` which will assign containerlogs to the job label.

## Start the stack

If you are following along all this configuration is available in my github repository https://github.com/ruanbekker/docker-promtail-loki .

Once you have everything in place you can start it with:

```bash
docker-compose up -d
```

Access nginx on http://localhost:8080

<img width="1113" alt="image" src="https://user-images.githubusercontent.com/567298/202505252-3cbc2d03-d1d2-48e6-bea7-5db54233b9a2.png">

Then navigate to grafana on http://localhost:3000 and select explore on the left and select the container:

<img width="560" alt="image" src="https://user-images.githubusercontent.com/567298/202504989-e05a08a2-eb2f-41a1-85f4-9a11a8affd7c.png">

And you will see the logs:

<img width="1425" alt="image" src="https://user-images.githubusercontent.com/567298/202505099-c47b76cc-3090-4eb9-8459-db659d0aac18.png">

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon


