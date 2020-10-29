---
layout: post
title: "Running Loki behind Nginx Reverse Proxy"
date: 2020-10-29 08:29:13 +0000
comments: true
categories: ["loki", "grafana", "logging", "nginx"]
---

In this tutorial I will demonstrate how to run **Loki v2.0.0** behind a **Nginx Reverse Proxy** with basic http authentication enabled on Nginx and what to do to configure Nginx for **websockets**, which is required when you want to use **tail in logcli** via Nginx.

## Assumptions

My environment consists of a AWS Application LoadBalancer with a Host entry and a Target Group associated to port 80 of my Nginx/Loki EC2 instance.

Health checks to my EC2 instance are being performed to `instance:80/ready`

I have a S3 bucket and a DynamoDB table already running in my account which Loki will use. But **NOTE** that boltdb-shipper is now production ready since [v2.0.0](https://github.com/grafana/loki/blob/v2.0.0/CHANGELOG.md#20), which is awesome, because now you only require a object store such as S3, so you don't need DynamoDB.

More information on this topic can be found under their [changelog](https://github.com/grafana/loki/blob/v2.0.0/CHANGELOG.md#20)

## What can you expect from this blogpost

We will go through the following topics:

  * Install Loki v2.0.0 and Nginx
  * Configure HTTP Basic Authentication to Loki's API Endpoints
  * Bypass HTTP Basic Authentication to the `/ready` endpoint for our Load Balancer to perform healthchecks
  * Enable Nginx to upgrade websocket connections so that we can use `logcli --tail`
  * Test out access to Loki via our Nginx Reverse Proxy
  * Install and use LogCLI

## Install Software

First we will install `nginx` and `apache2-utils`. In my use-case I will be using Ubuntu 20 as my operating system:

```
$ sudo apt update && sudp apt install nginx apache2-utils -y
```

Next we will install Loki v2.0.0, if you are upgrading from a previous version of Loki, I would recommend checking out the [upgrade guide](https://github.com/grafana/loki/releases/tag/v2.0.0) mentioned on their releases page.

Download the package:

```
$ curl -O -L "https://github.com/grafana/loki/releases/download/v2.0.0/loki-linux-amd64.zip"
```

Unzip the archive:

```
$ unzip loki-linux-amd64.zip
```

Move the binary to your $PATH:

```
$ sudo mv loki-linux-amd64 /usr/local/bin/loki
```

And ensure that the binary is executable:

```
$ sudo chmod a+x /usr/local/bin/loki
```

## Configuration

Create the user that will be responsible for running loki:

```
$ useradd --no-create-home --shell /bin/false loki
```

Create the directory where we will place the loki configuration:

```
$ mkdir /etc/loki
```

Create the loki configuration file:

```
$ cat /etc/loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100
  http_listen_address: 127.0.0.1
  http_server_read_timeout: 1000s
  http_server_write_timeout: 1000s
  http_server_idle_timeout: 1000s
  log_level: info

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_encoding: snappy
  chunk_idle_period: 1h
  chunk_target_size: 1048576
  chunk_retain_period: 30s
  max_transfer_retries: 0

# https://grafana.com/docs/loki/latest/configuration/#schema_config
schema_config:
  configs:
    - from: 2020-05-15
      store: aws
      object_store: s3
      schema: v11
      index:
        prefix: loki-logging-index

storage_config:
  aws:
    http_config:
      idle_conn_timeout: 90s
      response_header_timeout: 0s
    s3: s3://myak:mysk@eu-west-1/loki-logs-datastore

    dynamodb:
      dynamodb_url: dynamodb://myak:mysk@eu-west-1

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  ingestion_rate_mb: 30
  ingestion_burst_size_mb: 60

# https://grafana.com/docs/loki/latest/operations/storage/retention/
# To avoid querying of data beyond the retention period, max_look_back_period config in chunk_store_config
# must be set to a value less than or equal to what is set in table_manager.retention_period
chunk_store_config:
  max_look_back_period: 720h

# https://grafana.com/docs/loki/latest/operations/storage/retention/
table_manager:
  retention_deletes_enabled: true
  retention_period: 720h
  chunk_tables_provisioning:
    inactive_read_throughput: 10
    inactive_write_throughput: 10
    provisioned_read_throughput: 50
    provisioned_write_throughput: 20
  index_tables_provisioning:
    inactive_read_throughput: 10
    inactive_write_throughput: 10
    provisioned_read_throughput: 50
    provisioned_write_throughput: 20
```

Apply permissions so that the loki user has access to it's configuration:

```
$ chown -R loki:loki /etc/loki
```

Create a systemd unit file:

```
$ cat /etc/systemd/system/loki.service
[Unit]
Description=Loki
Wants=network-online.target
After=network-online.target

[Service]
User=loki
Group=loki
Type=simple
Restart=on-failure
ExecStart=/usr/local/bin/loki -config.file /etc/loki/loki-config.yml

[Install]
WantedBy=multi-user.target
```

Create the main nginx config:

```
$ cat /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
worker_rlimit_nofile 100000;

events {
        worker_connections 4000;
        use epoll;
        multi_accept on;
}

http {

	# basic settings
	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
        open_file_cache_valid 30s;
        open_file_cache_min_uses 2;
        open_file_cache_errors on;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

        # ssl settings
	ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
	ssl_prefer_server_ciphers on;

	# websockets config
	map $http_upgrade $connection_upgrade {
            default upgrade;
            '' close;
        }

	# logging settings
	access_log off;
	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	# gzip settings
	gzip on;
    	gzip_min_length 10240;
    	gzip_comp_level 1;
    	gzip_vary on;
    	gzip_disable msie6;
    	gzip_proxied expired no-cache no-store private auth;
    	gzip_types
    	text/css
    	text/javascript
    	text/xml
    	text/plain
    	text/x-component
    	application/javascript
    	application/x-javascript
    	application/json
   	application/xml
    	application/rss+xml
   	application/atom+xml
    	font/truetype
    	font/opentype
    	application/vnd.ms-fontobject
    	image/svg+xml;
    	reset_timedout_connection on;
    	client_body_timeout 10;
    	send_timeout 2;
    	keepalive_requests 100000;
        
        # virtual host configs
   	include /etc/nginx/conf.d/loki.conf;
}
```

Create the virtual host config:

```
$ cat /etc/nginx/conf.d/loki.conf
upstream loki {
  server 127.0.0.1:3100;
  keepalive 15;
}

server {
  listen 80;
  server_name loki.localdns.xyz;

  auth_basic "loki auth";
  auth_basic_user_file /etc/nginx/passwords;

  location / {
    proxy_read_timeout 1800s;
    proxy_connect_timeout 1600s;
    proxy_pass http://loki;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_redirect off;
  }

  location /ready {
    proxy_pass http://loki;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_redirect off;
    auth_basic "off";
  }
}
```

As you've noticed, we are providing a `auth_basic_user_file` to `/etc/nginx/passwords`, so let's create a user that we will be using to authenticate against loki:

```
$ htpasswd -c /etc/nginx/passwords lokiisamazing
```

## Enable and Start Services

Because we created a systemd unit file, we need to reload the systemd daemon:

```
$ sudo systemctl daemon-reload
```

Then enable nginx and loki on boot:

```
$ sudo systemctl enable nginx
$ sudo systemctl enable loki
```

Then start or restart both services:

```
$ sudo systemctl restart nginx
$ sudo systemctl restart loki
```

You should see both ports, 80 and 3100 are listening:

```
$ sudo netstat -tulpn | grep -E '(3100|80)'
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      8949/nginx: master
tcp        0      0 127.0.0.1:3100          0.0.0.0:*               LISTEN      23498/loki
```

## Test Access

You will notice that I have a `/ready` endpoint that I am proxy passing to loki, which bypasses authentication, this has been setup for my AWS Application Load Balancer's Target Group to perform health checks against.

We can verify if we are getting a 200 response code without passing authentication:

```
$ curl -i http://loki.localdns.xyz/ready
HTTP/1.1 200 OK
Server: nginx/1.14.0 (Ubuntu)
Date: Thu, 29 Oct 2020 09:15:52 GMT
Content-Type: text/plain; charset=utf-8
Content-Length: 6
Connection: keep-alive
X-Content-Type-Options: nosniff

ready
```

If we try to make a request to Loki's labels API endpoint, you will notice that we are returned with a 401 unauthorized response:

```
$ curl -i http://loki.localdns.xyz/loki/api/v1/labels
HTTP/1.1 401 Unauthorized
Server: nginx/1.14.0 (Ubuntu)
Date: Thu, 29 Oct 2020 09:16:52 GMT
Content-Type: text/html
Content-Length: 204
Connection: keep-alive
WWW-Authenticate: Basic realm="loki auth"
```

So let's access the labels API endpoint by passing our basic auth credentials. To leave no leaking passwords behind, create a file and save your password content in that file:

```
$ vim /tmp/.pass
-> then enter your password and save the file <-
```

Expose the content as an environment variable:

```
$ pass=$(cat /tmp/.pass)
```

Now make a request to Loki's labels endpoint by passing authentication:

```
$ curl -i -u lokiisawesome:$pass http://loki.localdns.xyz/loki/api/v1/labels
HTTP/1.1 200 OK
Server: nginx/1.14.0 (Ubuntu)
Date: Thu, 29 Oct 2020 09:20:20 GMT
Content-Type: application/json; charset=UTF-8
Content-Length: 277
Connection: keep-alive

{"status":"success","data":["__name__","aws_account","cluster_name","container_name","environment","filename","job","service","team"]}
```

Then ensure that your remove the password file:

```
$ rm -rf /tmp/.pass
```

And unset your pass environment variable, to clean up your tracks:

```
$ unset pass
```

## LogCLI

Now for my favorite part, using logcli to interact with Loki, but more specifically using `--tail` as it requires websockets, nginx will now be able to upgrade those connections:

Install logcli, in my case I am using a mac, so I will be using darwin:

```
$ wget https://github.com/grafana/loki/releases/download/v2.0.0/logcli-darwin-amd64.zip
$ unzip logcli-darwin-amd64.zip
$ mv logcli-darwin-amd64 /usr/local/bin/logcli
```

Set your environment variables for logcli:

```
$ export LOKI_ADDR=https://loki.yourdomain.com # im doing ssl termination on the aws alb
$ export LOKI_USERNAME=lokiisawesome
$ export LOKI_PASSWORD=$pass 
```

Now for that sweetness of tailing ALL THE LOGS!! :-D . Let's first discover the label that we want to select:

```
$ logcli labels --quiet container_name | grep deadman
ecs-deadmanswitch-4-deadmanswitch-01234567890abcdefghi
```

Then tail for the win!

```
$ logcli query --quiet --output raw --tail '{job="prod/dockerlogs", container_name=~"ecs-deadmanswitch.*"}'
time="2020-10-29T09:03:36Z" level=info msg="timerID: xxxxxxxxxxxxxxxxxxxx"
time="2020-10-29T09:03:36Z" level=info msg="POST - /ping/xxxxxxxxxxxxxxxxxxx"
```

Awesome right?

![](https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif)


## Thank You

Hope that you found this useful, make sure to follow Grafana's blog for more awesome content:

  * https://grafana.com/blog/

If you liked this content, please make sure to share or come say hi on my website or twitter:

  * [w: ruan.dev](https://ruan.dev)
  * [t: @ruanbekker](https://ruan.dev)

For other content of mine on Loki:

  * https://blog.ruanbekker.com/blog/categories/loki/
  * https://github.com/ruanbekker/docker-loki-distributed-minio
  * https://github.com/ruanbekker/loki-docker-nginx-example
  * https://github.com/ruanbekker/loki-minio-docker
  * https://github.com/ruanbekker/cheatsheets/tree/master/loki 
