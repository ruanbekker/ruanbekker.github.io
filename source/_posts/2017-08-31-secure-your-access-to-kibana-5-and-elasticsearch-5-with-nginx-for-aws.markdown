---
layout: post
title: "Secure your Access to Kibana 5 and Elasticsearch 5 with Nginx for AWS"
date: 2017-08-31 10:40:09 -0400
comments: true
categories: ["aws", "nginx", "elasticsearch", "kibana", "security"] 
---

As ~~until now, AWS does not offer VPC Support for Elasticsearch~~, so this make things a bit difficult authorizing Private IP Ranges.

One workaround would be to setup a Nginx Reverse Proxy on AWS within the your Private VPC, associate a EIP on your Nginx EC2 Instance, then authorize your EIP on your Elasticsearch IP Access Policy.

**Update**:

- [Elasticsearch Announced VPC Support for Elasticsearch](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-vpc.html)

## Our Setup:

In this setup, we will have an Internal ELB (Elastic Load Balancer), which we will associate 1 or more EC2 Nginx Instances behind the ELB, then setup our Nginx to Revere Proxy our connections through to our Elasticsearch Endpoint.

We will also setup Basic HTTP Authentication for our `/` elasticsearch endpoint, and our `/kibana` endpoint. But we will keep the authentication seperate from each other, so that credentials for ES and Kibana is not the same, but depending on your use case, you can allow both endpoints to reference the same credential file.

## Install Nginx

Depending on your Linux Distribution, the package manager may differ, I am using Amazon Linux:

```bash Install Nginx
$ sudo yum update -y
$ sudo yum install nginx httpd-tools -y
```

## Configure Nginx:

Remove the default configuration and replace the `nginx.conf` with the following:

```bash Remove Default Nginx Config
$ sudo rm -r /etc/nginx/nginx.conf
```

Main Nginx Configuration:

```bash /etc/nginx/nginx.conf
user nginx;
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

	# Elasticsearch Config
	include /etc/nginx/conf.d/elasticsearch.conf;
}
```

The Reverse Proxy Configuration:

```bash /etc/nginx/conf.d/elasticsearch.conf
server {

  listen 80;
  server_name elk.mydomain.com;

  # error logging
  error_log /var/log/nginx/elasticsearch_error.log;

  # authentication: server wide
  #auth_basic "Auth";
  #auth_basic_user_file /etc/nginx/.secrets;

  location / {
 
    # authentication: elasticsearch
    auth_basic "Elasticsearch Auth";
    auth_basic_user_file /etc/nginx/.secrets_elasticsearch;

    proxy_http_version 1.1;
    proxy_set_header Host https://search.eu-west-1.es.amazonaws.com;
    proxy_set_header X-Real-IP {NGINX-EIP};
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header Authorization "";

    proxy_pass https://search.eu-west-1.es.amazonaws.com/;
    proxy_redirect https://search.eu-west-1.es.amazonaws.com/ http://{NGINX-EIP}/;

  }

  location /kibana {
 
    # authentication: kibana
    auth_basic "Kibana Auth";
    auth_basic_user_file /etc/nginx/.secrets_kibana;

    proxy_http_version 1.1;
    proxy_set_header Host https://search.eu-west-1.es.amazonaws.com;
    proxy_set_header X-Real-IP {NGINX-EIP};
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header Authorization "";

    proxy_pass https://search.eu-west-1.es.amazonaws.com/_plugin/kibana/;
    proxy_redirect https://search.eu-west-1.es.amazonaws.com/_plugin/kibana/ http://{NGINX_EIP}/kibana/;

  }

  # elb checks
  location /status {
    root /usr/share/nginx/html/;
  }

}
```

## Setup Authentication:

Setup the authentication for elasticsearch and kibana:

```bash Create Auth for Kibana and Elasticsearch
$ sudo htpasswd -c /etc/nginx/.secrets_elasticsearch admin
$ sudo htpasswd -c /etc/nginx/.secrets_kibana admin
```

## Restart Nginx and Enable on Startup

Restart the nginx process and enable the process on boot:

```bash Restart Nginx
$ sudo /etc/init.d/nginx restart
$ sudo chkconfig nginx on
```

## Configure ELB:

Create a New Internal ELB, set the Backend Instances on Port 80, and the healthcheck should point to `/status/index.html` as this location block does not require authentication and our ELB will be able to get a 200 reponse if all is good. 
Next you can configure your Route 53 Hosted Zone, `elk.mydomain.com` to map to your ELB.

## End Result

Now you should be able to access Elasticsearch on `http://elk.mydomain.com/` and Kibana on `http://elk.mydomain.com/kibana` after authenticating.

<p>
<script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script> 
