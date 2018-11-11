---
layout: post
title: "Setup APM Server on Ubuntu for your Elastic Stack to get insights in your Application Performance Metrics"
date: 2018-11-11 12:31:43 -0500
comments: true
categories: ["elastic", "kibana", "elasticsearch", "apm", "metrics", "monitoring"] 
---

![](https://objects.ruanbekker.com/assets/images/elastic-apm-overview.png)

In this post we will setup the Elastic Stack with Elasticsearc, Kibana and APM . The APM Server (Application Performance Metrics) which will receive the metric data from the application side, and is then pushed to apm indices on Elasticsearch.

This will be a 2 post blog on APM:

- 1) [Setup the Elastic Stack with Elasticsearch, Kibana and APM Server]() - this post
- 2) [Setup a Python Flask application with the APM Agent](https://blog.ruanbekker.com/blog/2018/11/11/get-application-performance-metrics-on-python-flask-with-elastic-apm-on-kibana-and-elasticsearch/)

## What is APM

This is Elastic's Open Source implementation of Application Performance Monitoring, which enables you to get insights in your applications performance. Having logs and system metrics is one thing, but having insights into your applications performance just enables you quicker resolution times to pinpoint when debugging a application that might be happening.

You get metrics like average, p99 response times etc, and also have insights when errors occur, it even allows you to look at the stacktrace, poinpointing on which line of your code it ocurred.

- [More Info](https://www.elastic.co/solutions/apm)

## APM Agents:

The APM Agents will be loaded inside your application, application metrics will then be pushed to the APM Server (which we will setup in this post), which then gets pushed to Elasticsearch and is then consumed by Kibana.

At the time of writing, the APM Agents are supported in the following languages:

- Node.js
- Django
- Flask
- Ruby on Rails
- Rack
- RUM
- Golang
- Java

## Setup the Elastic Stack

One thing to note, every service in your Elastic Stack needs to be running on the same version. In this post we will setup Elasticsearch, APM and Kibana all running on version `6.4.3`

## Setup the Pre-Requirements:

Elasticsearch depends on Java, se we will go ahead and setup the repositories:

```bash
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
$ apt-get install apt-transport-https -y
$ echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
$ apt update && apt upgrade -y 
$ apt install openjdk-8-jdk -y
```

Verify that Java is installed:

```bash
$ java -version
openjdk version "1.8.0_181"
OpenJDK Runtime Environment (build 1.8.0_181-8u181-b13-1ubuntu0.16.04.1-b13)
OpenJDK 64-Bit Server VM (build 25.181-b13, mixed mode)
```

Setup Kernel parameters for Elasticsearch:

```bash
$ sysctl -w vm.max_map_count=262144
$ echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
```

## Setup Elasticsearch:

Search for the latest versions (when already having elasticsearch, either upgrade or install apm on the same version as elasticsearch/kibana):

```bash
$ apt-cache madison elasticsearch
elasticsearch |      6.4.3 | https://artifacts.elastic.co/packages/6.x/apt stable/main amd64 Packages
elasticsearch |      6.4.2 | https://artifacts.elastic.co/packages/6.x/apt stable/main amd64 Packages
```

Install Elasticsearch:

```bash
$ apt-get install elasticsearch=6.4.3 -y
```

Configure Elasticsearch to lock the memory on startup:

```bash
$ sed -i 's/#bootstrap.memory_lock: true/bootstrap.memory_lock: true/g' /etc/elasticsearch/elasticsearch.yml
```

Enable Elasticsearch on startup and start the service:

```
$ systemctl daemon-reload
$ systemctl enable elasticsearch.service
$ systemctl start elasticsearch.service
```

## Install Kibana:

Install Kibana version `6.4.3`:

```bash
$ apt install kibana=6.4.3 -y
```

For demonstration, I will configure Kibana to listen on all interfaces on port `5601`, but note this will enable access for everyone, you can [follow this blogpost] to setup a Nginx Reverse Proxy to upstream to localhost on port 5601.

Since this demonstration we are using Elasticsearch locally, so if you have a remote cluster, configuration can be applied where needed.

```bash
$ sed -i 's/#server.host: "localhost"/server.host: "0.0.0.0"/'g /etc/kibana/kibana.yml
$ sed -i 's/#elasticsearch.url: "http:\/\/localhost:9200"/elasticsearch.url: "http:\/\/localhost:9200"/'g /etc/kibana/kibana.yml
```

Enable Kibana on startup and start the service:

```bash
$ systemctl enable kibana.service
$ systemctl restart kibana.service
```

## Install the APM Server

Install APM Server version `6.4.3`:

```bash
$ apt install apm-server=6.4.3 -y
```

Since we have everything locally, the configuration can be kept as is, but if you need to configure the elasticsearch or kibana hosts, it can be done via `/etc/apm-server/apm-server.yml`

Then once Kibana and Elasticsearch is started, load the mapping templates, enable and start the service:

```bash
$ apm-server setup
$ systemctl enable apm-server.service
$ systemctl restart apm-server.service
```

Ensure all the services are running with `netstat -tulpn` and port `9200`, `9300`, `5601` and `8300` should be listening

## Access Your Elastic Stack

Access Kibana on your routable endpoint on port `5601` and you should see something like this:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-startup.png)

## Configuring a Application to push metrics to APM

In the [next post](https://blog.ruanbekker.com/blog/2018/11/11/get-application-performance-metrics-on-python-flask-with-elastic-apm-on-kibana-and-elasticsearch/) I will setup a Python Flask Application on APM
