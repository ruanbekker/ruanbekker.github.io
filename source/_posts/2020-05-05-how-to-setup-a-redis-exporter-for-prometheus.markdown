---
layout: post
title: "How to setup a Redis Exporter for Prometheus"
date: 2020-05-05 23:14:52 +0200
comments: true
categories: ["prometheus", "redis"] 
---

In this tutorial we will visualize our Redis Cluster's Metrics with Grafana. In order to do that we will setup a [redis exporter](https://github.com/oliver006/redis_exporter) which will authenticate with redis and then configure prometheus to scrape the endpoint of the redis exporter's http endpoint to write the time series data to prometheus.

## Install Golang

We need to build a binary from the redis exporter project, and we need a Golang environment. If you don't have golang installed already:

```
$ cd /tmp/
$ wget https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz
$ tar -xf go1.14.2.linux-amd64.tar.gz -C /usr/local
$ mkdir -p $HOME/go/{bin,src,pkg}
$ export GOPATH=/go
$ export PATH=${PATH}:${GOPATH}/bin:/usr/local/go/bin
```

You should now be able to get a response:

```
$ go version
go version go1.14.2 linux/amd64
```

## Redis Exporter

Get the source code and build the binary:

```
$ git clone https://github.com/oliver006/redis_exporter.git
$ cd redis_exporter
$ go build .
```

Now the binary should be built, and you should be able to get a response when running the following:

```
$ ./redis_exporter --help
```

Copy the binary the the following path:

```
$ cp redis_exporter /usr/bin/
```

Then create the systemd unit file, in `/etc/systemd/system/redis_exporter.service`:

```
[Unit]
Description=Redis Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=root
Group=root
Type=simple
ExecStart=/usr/bin/redis_exporter \
    -web.listen-address ":9121" \
    -redis.addr "redis://ip.of.redis.server:6379" \
    -redis.password "your-strong-redis-password"

[Install]
WantedBy=multi-user.target
```

Reload systemd:

```
$ systemctl daemon-relaod
```

Then start the redis exporter:

```
$ systemctl restart redis_exporter
```

Now you should be able to get redis metrics when you hit the redis exporter:

```
$ curl http://127.0.0.1:9121/metrics
...
# TYPE redis_commands_duration_seconds_total counter
redis_commands_duration_seconds_total{cmd="auth"} 0.000308
redis_commands_duration_seconds_total{cmd="client"} 0.000251
redis_commands_duration_seconds_total{cmd="config"} 0.010594
redis_commands_duration_seconds_total{cmd="evalsha"} 229.214873
redis_commands_duration_seconds_total{cmd="get"} 0.002343
redis_commands_duration_seconds_total{cmd="info"} 0.013722
redis_commands_duration_seconds_total{cmd="latency"} 0.000557
redis_commands_duration_seconds_total{cmd="lrange"} 11.102069
redis_commands_duration_seconds_total{cmd="ltrim"} 3.731263
redis_commands_duration_seconds_total{cmd="ping"} 2e-05
redis_commands_duration_seconds_total{cmd="rpush"} 3.460981
redis_commands_duration_seconds_total{cmd="script"} 0.008393
redis_commands_duration_seconds_total{cmd="set"} 0.001329
redis_commands_duration_seconds_total{cmd="slowlog"} 0.001308
...
```

## Configure Prometheus

If you don't have prometheus setup, you can [view this blogpost](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/) to get it setup.

Then configure your `prometheus.yml` and add the target to scrape the redis exporter endpoint to write the time series data into prometheus:

```
scrape_configs:
  - job_name: redis_exporter
    static_configs:
    - targets: ['ip.of.redis.exporter:9121']
```

Then restart prometheus, if you have docker redeploy your stack or prometheus container. For prometheus as a service you can use `systemctl restart prometheus`, depending on your operating system distribution.

## Grafana

Head over to Grafana, if you don't have Grafana, you can [view this post](https://blog.ruanbekker.com/blog/2019/05/17/install-grafana-to-visualize-your-metrics-from-datasources-such-as-prometheus-on-linux/) to install Grafana.

Then import the dashboard [763](https://grafana.com/grafana/dashboards/763) and after some time, you should see a dashboard more or less like this:

<img width="1280" alt="image" src="https://user-images.githubusercontent.com/567298/81118917-0b58f880-8f2a-11ea-941a-b43696fab9b0.png">

