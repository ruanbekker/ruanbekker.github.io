---
layout: post
title: "Nginx Reverse Proxy for Elasticsearch and Kibana 5 on AWS"
date: 2017-09-16 17:24:32 -0400
comments: true
categories: ["aws", "elasticsearch", "kibana", "nginx", "proxy", "security"] 
---

As up untill today, there's currently no VPC Support for Amazon's Elasticsearch Service.

So for scenarios where you would like to allow private network traffic to Elasticsearch is impossible straight out of the box as Amazon's Elasticsearch Services, only sees Public Internet Traffic.

We will setup 2 configs, one for Kibana and one for Elasticsearch, each one having its own FQDN:

- Kibana: `http://kibana.domain.com`
- Elasticsearch: `http://elasticsearch.domain.com`

## Workaround:

There's a couple of workarounds, which includes:

- Nginx Reverse Proxy
- NAT Gateway
- Allow IAM Users/Roles

Today we will tackle the Nginx Reverse Proxy Route.

The benefit of this, would be to associate an EIP to the Nginx EC2 Instnace, then whitelist your EIP with Elasticsearch, so the only traffic that will be accepted will be the traffic that is coming from the Nginx Instance. We will also apply an additional layer of security, in this case we will use HTTP Basic Authentication, then also authorize network sources on a Security Group level.

## Installing Nginx:

In this case I am using Ubuntu 16.04, so we will need to install `nginx` and `apache2-utils` for creating the Basic HTTP Auth accounts.

```bash
$ apt update && apt upgrade -y
$ apt install nginx apache2-utils -y
```

## Configure Nginx:

Our main config: `/etc/nginx/nginx.conf`:

```bash /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;

events {
	worker_connections 1024;
}

http {

	# Basic Settings
	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	server_names_hash_bucket_size 128;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	# Logging Settings
        log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

	access_log /var/log/nginx/access.log main;

	# Gzip Settings
	gzip on;
	gzip_disable "msie6";

	# Elasticsearch and Kibana Configs
	include /etc/nginx/conf.d/elasticsearch.conf;
	include /etc/nginx/conf.d/kibana.conf;
}
```

Our `/etc/nginx/conf.d/elasticsearch.conf` configuration:

```bash /etc/nginx/conf.d/elasticsearch.conf
server {

  listen 80;
  server_name elasticsearch.domain.com;

  # error logging
  error_log /var/log/nginx/elasticsearch_error.log;

  # authentication: elasticsearch
  auth_basic "Elasticsearch Auth";
  auth_basic_user_file /etc/nginx/.secrets_elasticsearch;

  location / {

    proxy_http_version 1.1;
    proxy_set_header Host https://search-elasticsearch-name.eu-west-1.es.amazonaws.com;
    proxy_set_header X-Real-IP <ELASTIC-IP>;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header Authorization "";

    proxy_pass https://search-elasticsearch-name.eu-west-1.es.amazonaws.com/;
    proxy_redirect https://search-elasticsearch-name.eu-west-1.es.amazonaws.com/ http://<ELASTIC-IP>/;

  }

  # ELB Health Checks
  location /status {
    root /usr/share/nginx/html/;
  }

}
```

Our `/etc/nginx/conf.d/kibana.conf` configuration:

```bash /etc/nginx/conf.d/kibana.conf
server {

  listen 80;
  server_name kibana.domain.com;

  # error logging
  error_log /var/log/nginx/kibana_error.log;

  # authentication: kibana
  auth_basic "Kibana Auth";
  auth_basic_user_file /etc/nginx/.secrets_kibana;

  location / {

    proxy_http_version 1.1;
    proxy_set_header Host https://search.elasticsearch-name.eu-west-1.es.amazonaws.com;
    proxy_set_header X-Real-IP <ELASTIC-IP>;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header Authorization "";

    proxy_pass https://search.elasticsearch-name.eu-west-1.es.amazonaws.com/_plugin/kibana/;
    proxy_redirect https://search.elasticsearch-name.eu-west-1.es.amazonaws.com/_plugin/kibana/ http://<ELASTIC-IP>/kibana/;

  }

      location ~ (/app/kibana|/app/timelion|/bundles|/es_admin|/plugins|/api|/ui|/elasticsearch) {
         proxy_pass              https://search.elasticsearch-name.eu-west-1.es.amazonaws.com;
         proxy_set_header        Host $host;
         proxy_set_header        X-Real-IP $remote_addr;
         proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header        X-Forwarded-Proto $scheme;
         proxy_set_header        X-Forwarded-Host $http_host;
         proxy_set_header 	 Authorization  "";
    }
}
```

Once you have replaced the elasticsearch endpoint and your EPI values, we can go ahead and create the auth accounts.

## Create User Accounts for HTTP Basic Auth

Create the 2 accounts for authentication on kibana and elasticsearch:

```bash
$ htpasswd -c /etc/nginx/.secrets_elasticsearch elasticsearch-admin
$ htpasswd -c /etc/nginx/.secrets_kibana kibana-admin
```

## Restart Nginx:

Restart and enable Nginx on boot:

```bash
$ systemctl enable nginx
$ systemctl restart nginx
```

Once your Nginx Service is running, you should be able to access Kibana and Elasticsearch using the credentials that you created.

## Resources:

- https://www.nginx.com/blog/tcp-load-balancing-udp-load-balancing-nginx-tips-tricks/
- https://www.elastic.co/blog/playing-http-tricks-nginx
- https://sysadmins.co.za/aws-access-kibana-5-behind-elb-via-nginx-reverse-proxy-on-custom-dns/

<center>
<script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script> 
</center>
