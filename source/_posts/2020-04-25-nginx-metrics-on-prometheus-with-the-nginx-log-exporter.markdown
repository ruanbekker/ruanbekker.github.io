---
layout: post
title: "Nginx Metrics on Prometheus with the Nginx Log Exporter"
date: 2020-04-25 01:42:35 +0200
comments: true
categories: ["prometheus", "metrics", "nginx", "monitoring"] 
---

In this post we will setup a nginx log exporter for prometeus to get metrics of our nginx web server, such as number of requests per method, status code, processed bytes etc. Then we will configure prometheus to scrape our nginx metric endpoint and also create a basic dashbaord to visualize our data.

If you follow along on this tutorial, it assumes that you have [Prometheus](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/) and [Grafana](https://blog.ruanbekker.com/blog/2019/05/17/install-grafana-to-visualize-your-metrics-from-datasources-such-as-prometheus-on-linux/) up and running. But if not the embedded links will take you to the blog posts to set it up.

## Nginx Webserver

Install nginx:

```
$ apt update
$ apt install nginx -y
```

Configure your nginx server's log format to match the nginx log exporter's expected format, we will name it custom:

```
  log_format custom   '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" "$http_x_forwarded_for"';

```

Edit your main nginx config:

```
$ vim /etc/nginx/nginx.conf
```

This is how my complete config looks like:

```
user www-data;
worker_processes auto;
pid /run/nginx.pid;
# remote the escape char if you are going to use this config
include /etc/nginx/modules-enabled/\*.conf;

events {
  worker_connections 768;
}

http {

  # basic config
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # ssl config
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2; 
  ssl_prefer_server_ciphers on;

  # logging config
  log_format custom   '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log custom;
  error_log /var/log/nginx/error.log;

  # gzip
  gzip on;

  # virtual host config
  include /etc/nginx/conf.d/myapp.conf;

}
```

I will delete the default host config:

```
$ rm -rf /etc/nginx/sites-enabled/default
```

And then create my `/etc/nginx/conf.d/myapp.conf` as referenced in my main config, with the following:

```
server {

  listen 80 default_server;
  # remove the escape char if you are going to use this config
  server_name \_;

  root /var/www/html;
  index index.html index.htm index.nginx-debian.html;

  location / {
    try_files $uri $uri/ =404;
  }

}
```

When you make a GET request to your server, you should see something like this in your access log:

```
10x.1x.2x.1x - - [25/Apr/2020:00:31:11 +0000] "GET / HTTP/1.1" 200 396 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15" "-"
```

## Nginx Log Exporter

Head over to the [prometheus-nginxlog-exporter releases](https://github.com/martin-helmich/prometheus-nginxlog-exporter/releases) page and get the latest version, in the time of writing it is v1.4.0:

```
$ wget https://github.com/martin-helmich/prometheus-nginxlog-exporter/releases/download/v1.4.0/prometheus-nginxlog-exporter
```

Make it executable and move it to your path:

```
$ chmod +x prometheus-nginxlog-exporter
$ mv prometheus-nginxlog-exporter /usr/bin/prometheus-nginxlog-exporter
```

Create the directory where we will place our config for our exporter:

```
$ mkdir /etc/prometheus
```

Create the config file:

```
$ vim /etc/prometheus/nginxlog_exporter.yml
```

You can follow the instructions from [github.com/prometheus-nginxlog-exporter](https://github.com/martin-helmich/prometheus-nginxlog-exporter) for more information on configuration, but I will be using the following config:

```
listen:
  port: 4040
  address: "0.0.0.0"

consul:
  enable: false

namespaces:
  - name: myapp
    format: "$remote_addr - $remote_user [$time_local] \"$request\" $status $body_bytes_sent \"$http_referer\" \"$http_user_agent\" \"$http_x_forwarded_for\""
    source:
      files:
        - /var/log/nginx/access.log
    labels:
      service: "myapp"
      environment: "production"
      hostname: "myapp.example.com"
    histogram_buckets: [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
```

Create the systemd unit file:

```
$ vim /etc/systemd/system/nginxlog_exporter.service
```

And my configuration that I will be using:

```
[Unit]
Description=Prometheus Log Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=root
Group=root
Type=simple
ExecStart=/usr/bin/prometheus-nginxlog-exporter -config-file /etc/prometheus/nginxlog_exporter.yml

[Install]
WantedBy=multi-user.target
```

Reload systemd and enable the service on boot:

```
$ systemctl daemon-reload
$ systemctl enable nginxlog_exporter
```

Restart the service:

```
$ systemctl restart nginxlog_exporter
```

Ensure that the service is running:

```
$ systemctl status nginxlog_exporter

● nginxlog_exporter.service - Prometheus Log Exporter
   Loaded: loaded (/etc/systemd/system/nginxlog_exporter.service; disabled; vendor preset: enabled)
   Active: active (running) since Sat 2020-04-25 00:50:06 UTC; 5s ago
 Main PID: 4561 (prometheus-ngin)
    Tasks: 7 (limit: 2317)
   CGroup: /system.slice/nginxlog_exporter.service
           └─4561 /usr/bin/prometheus-nginxlog-exporter -config-file /etc/prometheus/nginxlog_exporter.yml

Apr 25 00:50:06 nginx-log-exporter systemd[1]: Started Prometheus Log Exporter.
Apr 25 00:50:06 nginx-log-exporter prometheus-nginxlog-exporter[4561]: loading configuration file /etc/prometheus/nginxlog_exporter.yml
Apr 25 00:50:06 nginx-log-exporter prometheus-nginxlog-exporter[4561]: using configuration {Listen:{Port:4040 Address:0.0.0.0} Consul:{Enable:false Address: Datacenter: Scheme: Toke
Apr 25 00:50:06 nginx-log-exporter prometheus-nginxlog-exporter[4561]: starting listener for namespace myapp
Apr 25 00:50:06 nginx-log-exporter prometheus-nginxlog-exporter[4561]: running HTTP server on address 0.0.0.0:4040
Apr 25 00:50:06 nginx-log-exporter prometheus-nginxlog-exporter[4561]: 2020/04/25 00:50:06 Seeked /var/log/nginx/access.log - &{Offset:0 Whence:2}
```

## Test the exporter

Make a couple of requests against your webserver:

```
$ for each in {1..10}; do curl http://78.141.211.49 ; done
```

So prometheus will now scrape the exporter http endpoint (`:4040/metrics`) and push the returned values into prometheus. But to get a feel on how the metrics look like, make a request to the metrics endpoint:

```
$ curl http://localhost:4040/metrics
...
# HELP myapp_http_response_count_total Amount of processed HTTP requests
# TYPE myapp_http_response_count_total counter
myapp_http_response_count_total{environment="production",hostname="myapp.example.com",method="GET",service="myapp",status="200"} 10
myapp_http_response_count_total{environment="production",hostname="myapp.example.com",method="POST",service="myapp",status="404"} 1
# HELP myapp_http_response_size_bytes Total amount of transferred bytes
# TYPE myapp_http_response_size_bytes counter
myapp_http_response_size_bytes{environment="production",hostname="myapp.example.com",method="GET",service="myapp",status="200"} 6120
myapp_http_response_size_bytes{environment="production",hostname="myapp.example.com",method="POST",service="myapp",status="404"} 152
# HELP myapp_parse_errors_total Total number of log file lines that could not be parsed
# TYPE myapp_parse_errors_total counter
myapp_parse_errors_total 0
...
```

As you can see we are getting metrics such as response count total, response size, errors, etc.

## Configure Prometheus

Let's configure prometheus to scrape this endpoint. Head over to your prometheus instance, and edit your prometheus config:

```
$ vim /etc/prometheus/prometheus.yml
```

Note that in my config I have 2 endpoints that I am scraping, the prometheus endpoint which exists and I will be adding the nginx endpoint, so in full, this is how my config will look like:

```
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nginx'
    scrape_interval: 15s
    static_configs:
      - targets: ['ip.of.nginx.exporter:4040']
```

Restart prometheus:

```
$ systemctl restart prometheus
```

To verify that the exporter is working as expected, head over to your prometheus ui on port 9090, and query `up{}` to see if your exporters are returning 1:

<img width="1280" alt="image" src="https://user-images.githubusercontent.com/567298/80267654-7b51be00-86a2-11ea-98e2-a48a5c2a1e4f.png">

We can then query prometheus with `myapp_http_response_count_total{service="myapp"}` to see the response counts:

<img width="1273" alt="image" src="https://user-images.githubusercontent.com/567298/80267823-590c7000-86a3-11ea-9098-28e37e7941d7.png">

## Dashboarding in Grafana

If you don't have Grafana installed, you can look at my [Grafana Installation](https://blog.ruanbekker.com/blog/2019/05/17/install-grafana-to-visualize-your-metrics-from-datasources-such-as-prometheus-on-linux/) post to get that up and running.

If you have not created the Prometheus datasource, on Grafana, head over to the configuration section on your left, select Datasources, add a Prometheus datasource and add the following (this is assuming grafana runs on the prometheus node - which is fine for testing):

<img width="592" alt="image" src="https://user-images.githubusercontent.com/567298/80267986-48a8c500-86a4-11ea-9046-3fba601d41cf.png">

Create a new dashboard and add a new panel:

<img width="605" alt="image" src="https://user-images.githubusercontent.com/567298/80267884-b3a5cc00-86a3-11ea-8624-797e5310de80.png">

Let's query our data to show us HTTP Method and Status code per 30s: `rate(myapp_http_response_count_total{service="myapp"}[$__interval])`

<img width="605" alt="image" src="https://user-images.githubusercontent.com/567298/80267884-b3a5cc00-86a3-11ea-8624-797e5310de80.png">

## Thank You

Hope you found this helpful, if you haven't seen my other posts on Prometheus, have a look at the following:

- [Setup Prometheus](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/) 
- [Setup Grafana](https://blog.ruanbekker.com/blog/2019/05/17/install-grafana-to-visualize-your-metrics-from-datasources-such-as-prometheus-on-linux/)
- [Setup Node Exporter](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/)
- [Setup Blackbox Exporter](https://blog.ruanbekker.com/blog/2019/05/17/install-blackbox-exporter-to-monitor-websites-with-prometheus/)
- [Setup Alertmanager](https://blog.ruanbekker.com/blog/2019/05/17/install-alertmanager-to-alert-based-on-metrics-from-prometheus/)
- [Setup Pushgateway](https://blog.ruanbekker.com/blog/2019/05/17/install-pushgateway-to-expose-metrics-to-prometheus/)
