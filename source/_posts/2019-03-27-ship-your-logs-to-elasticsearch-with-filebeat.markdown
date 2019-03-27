---
layout: post
title: "Ship your Logs to Elasticsearch with Filebeat"
date: 2019-03-27 10:52:21 -0400
comments: true
categories: ["filebeat", "logs", "kibana", "elasticsearch"] 
---
![](https://user-images.githubusercontent.com/567298/55086561-4b0baa80-50b1-11e9-8062-a9e6de5ab56a.png)

**[Filebeat](https://www.elastic.co/guide/en/beats/filebeat/6.7/filebeat-overview.html)** by Elastic is a lightweight log shipper, that ships your logs to Elastic products such as Elasticsearch and Logstash. Filbeat monitors the logfiles from the given configuration and ships the to the locations that is specified.

## Filebeat Overview

Filebeat runs as agents, monitors your logs and ships them in response of events, or whenever the logfile receives data.

Below is a overview (credit: elastic.co) how Filebeat works

![](https://user-images.githubusercontent.com/567298/55086346-e18b9c00-50b0-11e9-8eac-ea4880cb1aff.png)

## Installing Filebeat

Let's go ahead and install Filebeat. I will be using version 6.7 as that will be the same version that I am running on my Elasticsearch. To check the version of your elasticsearch cluster:

```bash
$ curl http://127.0.0.1:9200/_cluster/health?pretty # i have es running locally
```

Install the dependencies:

```bash
$ apt install wget apt-transport-https -y
```

Get the public signing key:

```bash
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

Get the repository definition:

```bash
$ echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-6.x.list
```

Update the repositories:

```bash
$ apt update && apt upgrade -y
```

Install Filebeat and enable the service on boot:

```bash
$ apt install filebeat -y
$ systemctl enable filebeat
```

## Configure Filebeat

Let's configure our main configuration in filebeat, to specify our location where the data should be shipped to (in this case elasticsearch) and I will also like to set some extra fields that will apply to this specific server.

Open up `/etc/filebeat/filebeat.yml` and edit the following:

```yaml
filebeat.inputs:

- type: log
  enabled: false
  paths:
    - /var/log/nginx/*.log 

filebeat.config.modules:
  path: ${path.config}/modules.d/*.yml
  reload.enabled: false

setup.template.settings:
  index.number_of_shards: 3

fields:
  blog_name: sysadmins
  service_type: webserver
  cloud_provider: aws

setup.kibana:
  host: "http://localhost:5601"
  username: "elastic"
  password: "changeme"

output.elasticsearch:
  hosts: ["localhost:9200"]
  protocol: "http"
  username: "elastic"
  password: "changeme"
```

Above, just setting my path to nginx access logs, some extra fields, including that it shoulds seed kibana with example visualizations and the output configuration of elasticsearch.

## Filebeat Modules

Filebeat comes with modules that has context on specific applications like nginx, mysql etc. Lets enable system (syslog, auth, etc) and nginx for our web server:

```bash
$ filebeat modules enable system
$ filebeat modules enable nginx
```

Example of my `/etc/filebeat/modules.d/system.yml` configuration: 

```yaml
- module: system
  syslog:
    enabled: true
    var.paths: ["/var/log/syslog"]

  auth:
    enabled: true
    var.paths: ["/var/log/auth.log"]
```

Example of my `/etc/filebeat/modules.d/nginx.yml` configuration:

```yaml
- module: nginx
  access:
    enabled: true
    var.paths: ["/var/log/nginx/access.log"]

  error:
    enabled: true
    var.paths: ["/var/log/nginx/error.log"]
```

Now setup the [templates](https://www.elastic.co/guide/en/beats/filebeat/6.7/filebeat-template.html)

```bash
$ filebeat setup
```

Then restart filebeat:

```bash
$ /etc/init.d/filebeat restart
```

You can have a look at the logs, should you need to debug:

```bash
tail -f /var/log/filebeat/filebeat
```

Your data should now be shipped to elasticsearch, by default under the `filebeat-YYYY.mm.dd` index pattern.

```bash
$ curl 'http://127.0.0.1:9200/_cat/indices/filebeat*?v'
health status index                     uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   filebeat-6.7.1-2019.03.27 CBdV7adjRKypN1wguwuHDA   3   1     453220            0    230.2mb        115.9mb
```

## Kibana

You can head over to Kibana at http://localhost:5601 (in this case) to visualize the data that is ingested into your filebeat index. I will write a tutorial on how to graph up most common dashboards later this week.

Thats it for now :D

## Resources:

- https://www.elastic.co/guide/en/beats/filebeat/6.7/index.html
