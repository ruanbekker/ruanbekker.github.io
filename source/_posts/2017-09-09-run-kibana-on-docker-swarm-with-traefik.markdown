---
layout: post
title: "Run Kibana on Docker Swarm with Traefik"
date: 2017-09-09 18:33:12 -0400
comments: true
categories: ["docker", "swarm", "docker-swarm-apps", "kibana", "traefik"] 
---

We will create a Kibana Service on Docker Swarm, that will sit behind a Traefik Reverse Proxy.

## Create the Overlay Network:

```bash
$ docker network create --driver overlay appnet
```

## Create the Traefik Service:

```bash
docker service create \
--name traefik \
--constraint 'node.role==manager' \
--publish 80:80 \
--publish 443:443 \
--publish 8080:8080 \
--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
--network appnet \
traefik:camembert \
--docker --docker.swarmmode  \
--docker.domain=apps.domain.com \
--docker.watch \
--logLevel=DEBUG \
--web
```

## Set DNS:

Set a wildcard `*.apps.domain.com` to resolve to `apps.domain.com`, where `apps.domain.com` resolves to your swarm addresses

## Create Kibana:

Create a Kibana Service and set the `ELASTICSEARCH_URL` to your External Elasticsearch Endpoint, take note that it uses port `9200` by default.

```bash
$ docker service create \
--name kibana \
--label 'traefik.port=5601' \
--network appnet \
--env KIBANA_ELASTICSEARCH_URL=elasticsearch.domain.com \
bitnami/kibana
```

## Access Kibana:

Your Kibana endpoint will be available at: `http://kibana.apps.domain.com`

## Resources:

- https://github.com/bitnami/bitnami-docker-kibana
- https://docs.traefik.io/

<center>
	<script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
