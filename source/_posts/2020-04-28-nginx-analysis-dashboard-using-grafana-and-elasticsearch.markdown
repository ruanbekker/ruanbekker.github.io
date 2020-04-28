---
layout: post
title: "Nginx Analysis Dashboard using Grafana and Elasticsearch"
date: 2020-04-28 20:07:22 +0200
comments: true
description: "I will be demonstrating how to build a full analysis dashboard using grafana and elasticsearch. Filebeat will pickup the logs from Nginx and output it to Redis, Logstash will read it from Redis and output to Elasticsearch, where we will visualize it from Grafana."
categories: ["nginx", "elasticsearch", "analytics", "logstash", "filebeat", "redis"]
---

In this post we will be setting up a **analytical dashboard** using **grafana** to visualize our **nginx access logs**. 

In this tutorial I will be using my other blog `sysadmins.co.za` which is being served on nginx. We will also be setting up the other components such as filebeat, logstash, elasticsearch and redis, which require if you would like to follow along.

## The End Result

We will be able to analyze our Nginx Access logs to answer questions such as:

* Whats the Top 10 Countries accessing your website in the last 24 hours
* Who's the Top 10 Referers?
* Whats the most popular page for the past 24 hours?
* How does the percentage of 200's vs 404's look like?
* Ability to view results based on status code
* Everyone loves a World Map to view hotspots

At the end of the tutorial, your dashboard will look similar to this:

<img width="1123" alt="grafana-elasticsearch-nginx-dashboard" src="https://user-images.githubusercontent.com/567298/80523974-32925180-898f-11ea-96b6-e8e559655745.png">

## High Level Overview

Our infrastructure will require Nginx with Filebeat, Redis, Logstash, Elasticsearch and Grafana and will look like this:

<img width="871" alt="grafana-elasticsearch-logs-setup" src="https://user-images.githubusercontent.com/567298/80526020-6d49b900-8992-11ea-9a39-67331ccc3808.png">

I will drill down how everything is connected:

1. Nginx has a custom `log_format` that we define, that will write to `/var/log/nginx/access_json.log`, which will be picked up by **Filebeat** as a input.
2. and **Filebeat** has an output that pushes the data to **Redis**
3. **Logstash** is configured with **Redis** as an input with configured filter section to transform the data and outputs to **Elasticsearch**
4. From **Grafana** we have a configured **Elasticsearch** datasource
5. Use the grafana template to build this awesome dashboard on Grafana

But first, a massive thank you to [akiraka](https://www.akiraka.net) for templatizing this dashboard and made it available on [grafana](https://grafana.com/orgs/akiraka)

## Let's build all the things

I will be using LXD to run my system/server containers (running ubuntu 18), but you can use a vps, cloud instance, multipass, virtualbox, or anything to host your servers that we will be deploying redis, logstash, etc.

Servers provisioned for this setup:

* Nginx
* Redis
* Logstash
* Elasticsearch
* Grafana
* Prometheus

## Elasticsearch

If you don't have a cluster running already, you can follow **[this tutorial](https://blog.ruanbekker.com/blog/2019/04/02/setup-a-5-node-highly-available-elasticsearch-cluster/)** which will help you deploy a HA Elasticsearch Cluster, or if you prefer docker, you can follow **[this tutorial](https://blog.ruanbekker.com/blog/2018/04/29/running-a-3-node-elasticsearch-cluster-with-docker-compose-on-your-laptop-for-testing/)**

## Redis

For our in-memory data store, I will be securing my redis installation with a password as well. 

Install redis:

```
$ apt update && apt install redis-server -y
```

Generate a password:

```
$ openssl rand -base64 36
9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv
```

In your redis config `/etc/redis/redis.conf`, you need to change the following:

```
...
bind 0.0.0.0
port 6379
daemonize yes
supervised systemd
requirepass 9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv
...
```

Restart redis to activate your changes:

```
$ systemctl restart redis.service
```

and then set and get a key using your password:

```
$ redis-cli -a "9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv" set test ok
$ redis-cli -a "9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv" get test
ok
```

## Logstash

On the logstash server, install the requirements:

```
$ apt update && apt install wget apt-transport-https default-jre -y
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
$ echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-7.x.list
```

Now the repository for elastic is setup now we need to update and install logstash:

```
$ apt update && apt install logstash -y
```

Once logstash is installed, we need to provide logstash with a configuration, in our scenario we will have a input for redis, a filter section to transform and output as elasticsearch. 

Just make sure of the following:

* Populate the connection details of redis (we will define the key in filebeat later)
* Ensure that `GeoLite2-City.mmdb` is in the path that I have under filter
* Populate the connectiond details of Elasticsearch and choose a suitable index name, we will need to provide that index name in Grafana later

Create the config: `/etc/logstash/conf.d/logs.conf` and my config will look like the following. ([config source](https://grafana.com/grafana/dashboards/11190))

```
input {
  redis {
    data_type =>"list"
    key =>"nginx_logs"
    host =>"10.47.127.37"
    port => 6379
    password => "9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv"
    db => 0
  }
}

filter {
  geoip {
    target => "geoip"
    source => "client_ip"
    database => "/usr/share/logstash/vendor/bundle/jruby/2.5.0/gems/logstash-filter-geoip-6.0.3-java/vendor/GeoLite2-City.mmdb"
    add_field => [ "[geoip][coordinates]", "%{[geoip][longitude]}" ]
    add_field => [ "[geoip][coordinates]", "%{[geoip][latitude]}" ]
    remove_field => ["[geoip][latitude]", "[geoip][longitude]", "[geoip][country_code]", "[geoip][country_code2]", "[geoip][country_code3]", "[geoip][timezone]", "[geoip][continent_code]", "[geoip][region_code]"]
  }
  mutate {
    convert => [ "size", "integer" ]
    convert => [ "status", "integer" ]
    convert => [ "responsetime", "float" ]
    convert => [ "upstreamtime", "float" ]
    convert => [ "[geoip][coordinates]", "float" ]
    remove_field => [ "ecs","agent","host","cloud","@version","input","logs_type" ]
  }
  useragent {
    source => "http_user_agent"
    target => "ua"
    remove_field => [ "[ua][minor]","[ua][major]","[ua][build]","[ua][patch]","[ua][os_minor]","[ua][os_major]" ]
  }
}
output {
  elasticsearch {
    hosts => ["10.47.127.132", "10.47.127.199", "10.47.127.130"]
    #user => "myusername"
    #password => "mypassword"
    index => "logstash-nginx-sysadmins-%{+YYYY.MM.dd}"
  }
}
```

## Nginx

On our nginx server we will install nginx and filebeat, then configure nginx to log to a custom log format, and configure filebeat to read the logs and push it to redis.

Installing nginx:

```
$ apt update && apt install nginx -y
```

Installing [filebeat](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-installation.html):

```
$ curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.6.2-amd64.deb
$ dpkg -i filebeat-7.6.2-amd64.deb
```

Next we will configure nginx to log to a seperate file with a custom log format to include data such as the, request method, upstream response time, hostname, remote address, etc.

Under the `http` directive in your `/etc/nginx/nginx.conf`, configure the `log_format` and `access_log`:

```
http {
...
        log_format json_logs '{"@timestamp":"$time_iso8601","host":"$hostname",'
                            '"server_ip":"$server_addr","client_ip":"$remote_addr",'
                            '"xff":"$http_x_forwarded_for","domain":"$host",'
                            '"url":"$uri","referer":"$http_referer",'
                            '"args":"$args","upstreamtime":"$upstream_response_time",'
                            '"responsetime":"$request_time","request_method":"$request_method",'
                            '"status":"$status","size":"$body_bytes_sent",'
                            '"request_body":"$request_body","request_length":"$request_length",'
                            '"protocol":"$server_protocol","upstreamhost":"$upstream_addr",'
                            '"file_dir":"$request_filename","http_user_agent":"$http_user_agent"'
                            '}';

        access_log  /var/log/nginx/access_json.log  json_logs;
...
}
```

Restart nginx to activate the changes:

```
$ systemctl restart nginx
```

Next we need to configure filebeat to read from our nginx access logs and configure the output to redis. Edit the filebeat config:

```
$ vim /etc/filebeat/filebeat.yml
```

And configure filebeat with the following and make sure to change the values where you need to:

```
# config source: akiraka.net
# filebeat input 
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nginx/access_json.log
  json.keys_under_root: true
  json.overwrite_keys: true
  json.add_error_key: true

# filebeat modules 
filebeat.config.modules:
  # remove the escape character before the wildcard below
  path: ${path.config}/modules.d/\*.yml
  reload.enabled: false

# elasticsearch template settings
setup.template.settings:
  index.number_of_shards: 3

# redis output
output.redis:
  hosts: ["10.47.127.140:6379"]
  password: "9V5YlWvm8WuC4n1KZLYUEbLruLJLNJEnDzhu4WnAIfgxMmlv"
  key: "nginx_logs"
  # ^ this key needs to be the same as the configured key on logstash 
  db: 0
  timeout: 5
```

Restart filebeat:

```
$ systemctl restart filebeat
```

When you make a request to your nginx server, you should see a similar logline like below:

```
$ tail -n1 /var/log/nginx/access_elg.log
{"@timestamp":"2020-04-28T20:05:03+00:00","host":"sysadmins-blog","server_ip":"10.68.100.89","client_ip":"x.x.x.x","xff":"x.x.x.x","domain":"sysadmins.co.za","url":"/","referer":"-","args":"-","upstreamtime":"0.310","responsetime":"0.312","request_method":"GET","status":"200","size":"4453","request_body":"-","request_length":"519","protocol":"HTTP/1.1","upstreamhost":"127.0.0.1:2369","file_dir":"/var/www/web/root/","http_user_agent":"Mozilla/5.0"}
```

## Grafana

On the grafana server, install grafana:

```
$ apt update && apt install apt-transport-https software-properties-common wget -y
$ wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
$ add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
$ apt update && apt install grafana -y
```

Now we need to install a couple of grafana plugins that we require for our dashboards:

```
$ grafana-cli plugins install grafana-worldmap-panel
$ grafana-cli plugins install grafana-clock-panel
$ grafana-cli plugins install grafana-piechart-panel
```

Now reload systemd and restart grafana:

```
$ systemctl daemon-reload
$ systemctl restart grafana-server
```

If you would like to setup nginx as a reverse proxy to grafana, you can have a look at **[this blogpost](https://blog.ruanbekker.com/blog/2019/05/17/install-grafana-to-visualize-your-metrics-from-datasources-such-as-prometheus-on-linux/)** on how to do that.

## Prometheus

If you don't have Prometheus installed already, you can view my [blogpost](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/) on setting up Prometheus.

## Verifying 

To verify if everything works as expected, make a request to your nginx server, then have a look if your index count on elasticsearch increases:

```
$ curl http://elasticsearch-endpoint-address:9200/_cat/indices/logstash-*?v
health status index                               uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   logstash-nginx-x-2020.04.28 SWbHCer-TeOcw6bi_695Xw   5   1      58279            0     32.6mb         16.3mb
```

If you dont, make sure that all the processes are running on the servers, and that each server is able to reach each other on the targeted ports.

## The Fun Part: Dashboarding

Now that we have everything in place, the fun part is to build the dashboards, first we need to configure elasticsearch as our datasource and specify the index we want to read from. Open grafana on `http://ip.of.grafana.server:3000`, default user and password is admin.

Select config on the left and select datasources, add a datasource, select elasticsearch and specify your datasource name, mine is **es-nginx** in this example, the **url** of your elasticsearch endpoint, if you have secured your elasticsearch cluster with authentication, provide the auth, then provide your index name as as provided in logstash.

My configured index will look like `logstash-nginx-sysadmins-YYYY-MM-dd`, therefore I specified index name as `logstash-nginx-sysadmins-*` and my timefield as `@timestamp`, the version, and select save and test, which would look like this:

<img width="569" alt="AC025E20-38D0-4676-B576-9F5932913BA1" src="https://user-images.githubusercontent.com/567298/80538019-48ab0c80-89a5-11ea-8f4f-a30384991ab9.png">

Now we will import our dashboard template (Once again a massive thank you to [Shenxiang, Qingkong and Ruixi](https://grafana.com/grafana/dashboards/11190) which made this template available!), head over to dashboards and select import, then provide the ID: `11190`, after that it will prompt what your dashboard needs to be named and you need to select your Elasticsearch and Prometheus datasource.

The description of the panels is in Chinese, if you would like it in english, I have translated mine to english and made the dashboard json available in [this gist](https://gist.githubusercontent.com/ruanbekker/699fca31ebd7223b675d0acd25ea84bc/raw/316a015a0464989117cd72a1e8e056854d582178/nginx_grafana_dashboard_11190_eng.json)

## Tour of our Dashboard Panels

Looking at our hotspot map:

<img width="1212" alt="grafana" src="https://user-images.githubusercontent.com/567298/80539136-48ac0c00-89a7-11ea-869d-597da4fa4d92.png">

The summary and top 10 pages:

<img width="1243" alt="76E8CBE1-4B03-4226-8041-B98879BAD66A" src="https://user-images.githubusercontent.com/567298/80540596-e86a9980-89a9-11ea-924d-29f777a7c15a.png">

Page views, historical trends:

<img width="1239" alt="grafana-page-views" src="https://user-images.githubusercontent.com/567298/80539728-4eeeb800-89a8-11ea-959e-5e2915387b7b.png">

Top 10 referers and table data of our logs:

<img width="1235" alt="B17C4F55-DF91-4EA0-9669-C237FF560459" src="https://user-images.githubusercontent.com/567298/80540381-772ae680-89a9-11ea-9067-61cd519c9d8a.png">

## Thank You

I hope this was useful, if you have any issues with this feel free to reach out to me. If you like my work, please feel free to share this post, follow me on Twitter at **[@ruanbekker](https://twitter.com/ruanbekker)** or visit me on my **[website](https://ruan.dev)**

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A6423ZIQ)
