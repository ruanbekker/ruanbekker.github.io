---
layout: post
title: "Install Pushgateway to Expose Metrics to Prometheus"
date: 2019-05-17 07:04:03 -0400
comments: true
categories: ["pushgateway", "prometheus", "metrics", "monitoring"] 
---
![](https://user-images.githubusercontent.com/567298/57307750-696bb980-70e5-11e9-9b0b-73ad88bde6a3.png)

In most cases when we want to scrape a node for metrics, we will install node-exporter on a host and configure prometheus to scrape the configured node to consume metric data. But in certain cases we want to push custom metrics to prometheus. In such cases, we can make use of pushgateway.

Pushgateway allows you to push custom metrics to push gateway's endpoint, then we configure prometheus to scrape push gateway to consume the exposed metrics into prometheus.

## Pre-Requirements

If you have not set up [Prometheus](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/), head over to **[this blogpost](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/)** to set up prometheus on Linux.

## What we will do?

In this tutorial, we will setup pushgateway on linux and after pushgateway has been setup, we will push some custom metrics to pushgateway and configure prometheus to scrape metrics from pushgateway.

## Install Pushgateway

Get the latest version of [pushgateway](https://prometheus.io/download/) from prometheus.io, then download and extract:

```
$ wget https://github.com/prometheus/pushgateway/releases/download/v0.8.0/pushgateway-0.8.0.linux-amd64.tar.gz
$ tar -xvf pushgateway-0.8.0.linux-amd64.tar.gz
```

Create the `pushgateway` user:

```
$ useradd --no-create-home --shell /bin/false pushgateway
```

Move the binary in place and update the permissions to the user that we created:

```
$ cp pushgateway-0.8.0.linux-amd64/pushgateway /usr/local/bin/pushgateway
$ chown pushgateway:pushgateway /usr/local/bin/pushgateway
```

Create the systemd unit file:

```
$ cat > /etc/systemd/system/pushgateway.service << EOF
[Unit]
Description=Pushgateway
Wants=network-online.target
After=network-online.target

[Service]
User=pushgateway
Group=pushgateway
Type=simple
ExecStart=/usr/local/bin/pushgateway \
    --web.listen-address=":9091" \
    --web.telemetry-path="/metrics" \
    --persistence.file="/tmp/metric.store" \
    --persistence.interval=5m \
    --log.level="info" \
    --log.format="logger:stdout?json=true"

[Install]
WantedBy=multi-user.target
EOF
```

Reload systemd and restart the pushgateway service:

```
$ systemctl daemon-reload
$ systemctl restart pushgateway
```

Ensure that pushgateway has been started:

```
$ systemctl status pushgateway
  pushgateway.service - Pushgateway
   Loaded: loaded (/etc/systemd/system/pushgateway.service; disabled; vendor preset: enabled)
   Active: active (running) since Tue 2019-05-07 09:05:57 UTC; 2min 33s ago
 Main PID: 6974 (pushgateway)
    Tasks: 6 (limit: 4704)
   CGroup: /system.slice/pushgateway.service
           └─6974 /usr/local/bin/pushgateway --web.listen-address=:9091 --web.telemetry-path=/metrics --persistence.file=/tmp/metric.store --persistence.interval=5m --log.level=info --log.format=logger:st

May 07 09:05:57 ip-172-31-41-126 systemd[1]: Started Pushgateway.
```

## Configure Prometheus

Now we want to configure prometheus to scrape pushgateway for metrics, then the scraped metrics will be injected into prometheus's time series database:

At the moment, I have prometheus, node-exporter and pushgateway on the same node so I will provide my complete prometheus configuration, If you are just looking for the pushgateway config, it will be the last line:

```
$ cat /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'pushgateway'
    honor_labels: true
    static_configs:
      - targets: ['localhost:9091']
```

Restart prometheus:

```
$ systemctl restart prometheus
```

## Push metrics to pushgateway

First we will look at a bash example to push metrics to pushgateway:

```
$ echo "cpu_utilization 20.25" | curl --data-binary @- http://localhost:9091/metrics/job/my_custom_metrics/instance/10.20.0.1:9000/provider/hetzner
```

Have a look at pushgateway's metrics endpoint:

```
$ curl -L http://localhost:9091/metrics/
# TYPE cpu_utilization untyped
cpu_utlization{instance="10.20.0.1:9000",job="my_custom_metrics",provider="hetzner"} 20.25
```

Let's look at a python example on how we can push metrics to pushgateway:

```python
import requests

job_name='my_custom_metrics'
instance_name='10.20.0.1:9000'
provider='hetzner'
payload_key='cpu_utilization'
payload_value='21.90'

response = requests.post('http://localhost:9091/metrics/job/{j}/instance/{i}/team/{t}'.format(j=job_name, i=instance_name, t=team_name), data='{k} {v}\n'.format(k=payload_key, v=payload_value))
print(response.status_code)
```

With this method, you can push any custom metrics (bash, lambda function, etc) to pushgateway and allow prometheus to consume that data into it's time series database.

## Resources:

See [#prometheus](https://blog.ruanbekker.com/blog/categories/prometheus/) for more posts on Prometheus
