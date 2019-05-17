---
layout: post
title: "Install Grafana to Visualize your Metrics from datasources such as Prometheus on Linux"
date: 2019-05-17 12:08:02 -0400
comments: true
categories: ["grafana", "prometheus", "metrics", "monitoring"] 
---

![image](https://user-images.githubusercontent.com/567298/57941411-2a045080-78cf-11e9-97f9-47fb8b75a722.png)

Grafana is a Open Source Dashboarding service that allows you to monitor, analyze and graph metrics from datasources such as prometheus, influxdb, elasticsearch, aws cloudwatch, and many more.

Not only is grafana amazing, its super pretty!

Example of how a dashboard might look like:

<img width="1279" alt="E24B39B1-23C8-44C5-959D-6E6275F8FE99" src="https://user-images.githubusercontent.com/567298/57942872-d98ef200-78d2-11e9-9370-b130bcc222f7.png">

## What are we doing today

In this tutorial we will setup grafana on linux. If you have not set up [prometheus](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/), follow [this blogpost](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/) to install prometheus.

## Install Grafana

I will be demonstrating how to install grafana on debian, if you have another operating system, head over to [grafana documentation](https://grafana.com/docs/installation/) for other supported operating systems.

Get the gpg key:

```
$ curl https://packages.grafana.com/gpg.key | sudo apt-key add -
```

Import the public keys:

```
$ apt-key adv --keyserver keyserver.ubuntu.com --recv-keys  8C8C34C524098CB6 
```

Add the latest stable packages to your repository:

```
$ add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
```

Install a pre-requirement package:

```
$ apt install apt-transport-https -y
```

Update the repository index and install grafana:

```
$ apt update && sudo apt install grafana -y
```

Once grafana is installed, start the service:

```
$ service grafana-server start
```

Then enable the service on boot:

```
$ update-rc.d grafana-server defaults
```

If you want to control the service via systemd:

```
$ systemctl daemon-reload
$ systemctl start grafana-server
$ systemctl status grafana-server
```

## Optional: Nginx Reverse Proxy

If you want to front your grafana instance with a nginx reverse proxy:

```
$ cat /etc/nginx/sites-enabled/grafana
server {
    listen 80;
    server_name grafana.domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_redirect http://127.0.0.1:3000/ /;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
```

Then restart nginx:

```
$ systemctl restart nginx
```

## Access Grafana

If you are accessing grafana directly, access grafana on `http://your-grafana-ip:3000/` and your username is `admin` and password `admin`

## Dashboarding Tutorials

Have a look at this screencast where the guys from grafana show you how to build dashboards:

<iframe width="560" height="315" src="https://www.youtube.com/embed/sKNZMtoSHN4" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

For more tutorials on prometheus and metrics have a look at **[#metrics](https://blog.ruanbekker.com/blog/categories/prometheus/)**
