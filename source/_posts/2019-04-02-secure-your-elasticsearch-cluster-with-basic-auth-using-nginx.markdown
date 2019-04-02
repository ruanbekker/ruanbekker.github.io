---
layout: post
title: "Secure your Elasticsearch Cluster with Basic Auth using Nginx and SSL from Letsencrypt"
date: 2019-04-02 14:55:58 -0400
comments: true
categories: ["nginx", "basic-auth", "elasticsearch", "security", "letsencrypt", "ssl"] 
---

In this tutorial we will setup a reverse proxy using nginx to translate and load balance traffic through to our elasticsearch nodes. We will also protect our elasticsearch cluster with basic auth and use letsencrypt to retrieve free ssl certificates.

We want to allow certain requests to be bypassed from authentication such as getting status from the cluster and certain requests we want to enforce authentication, such as indexing and deleting data.

## Install Nginx:

Install nginx and the dependency package to create basic auth:

```bash
$ apt install nginx apache2-utils -y
```

## Configure Nginx for Reverse Proxy

We want to access our nginx proxy on port 80: `0.0.0.0:80` and the requests should be proxied through to elasticsearch private addresses: `10.0.0.10:9200` and `10.0.0.11:9200`. Traffic will be load balanced between our 2 nodes.

Edit the main nginx configuration: 

```
$ vim /etc/nginx/nginx.conf
```

and populate the information as shown below:

```
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
	worker_connections 1024;
	# multi_accept on;
}

http {

	# basic Settings
	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	# ssl settings
	ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
	ssl_prefer_server_ciphers on;

	# logging settings
	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	# gzip settings
	gzip on;
	gzip_disable "msie6";

	# virtual host configs
	include /etc/nginx/conf.d/*.conf;
}
```

Next, edit the virtual host config:

```
$ vim /etc/nginx/conf.d/elasticsearch.conf
```

And populate the following config:

```
# https://gist.github.com/sahilsk/b16cb51387847e6c3329

upstream elasticsearch {
    # define your es nodes
    server 10.0.0.10:9200;
    server 10.0.0.11:9200;
    # persistent http connections
    # https://www.elastic.co/blog/playing-http-tricks-nginx
    keepalive 15;
}

server {
  listen 80;
  server_name elasticsearch.domain.com;

  auth_basic "server auth";
  auth_basic_user_file /etc/nginx/passwords;

  location / {

    # deny node shutdown api
    if ($request_filename ~ "_shutdown") {
      return 403;
      break;
    }

    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_redirect off;
  }

  location = / {
    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_redirect off;
    auth_basic "off";
  }

  location ~* ^(/_cluster/health|/_cat/health) {
    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_redirect off;
    auth_basic "off";
  }
}
```

Set your username and password to protect your endpoint:

```bash
$ htpasswd -c /etc/nginx/passwords admin
```

Enable nginx on boot and restart the process:

```bash
$ systemctl enable nginx
$ systemctl restart nginx
```

## Test it

Now make requests to elasticsearch via your nginx reverse proxy:

```bash
$ curl -H 'Content-Type: application/json' -u 'admin:admin' http://myproxy.domain.com/_cat/indices?v
health status index       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   first-index 1o6yM7tCSqagqoeihKM7_g   5   1          3            0     40.6kb         20.3kb
```

## Letsencrypt SSL Certificates

Add free SSL Certificates to your reverse proxy. Install certbot:

```bash
$ apt-get update
$ apt-get install software-properties-common -y
$ add-apt-repository universe
$ add-apt-repository ppa:certbot/certbot
$ apt-get update
$ apt-get install certbot python-certbot-nginx -y
```

Request a Certificate for your domain:

```bash
$ certbot --manual certonly -d myproxy.domain.com -m my@email.com --preferred-challenges dns --agree-tos

Obtaining a new certificate
Performing the following challenges:
dns-01 challenge for myproxy.domain.com
```

You will be prompted to make a dns change, since we requested the dns challenge. While this screen is here, we can go our dns provider and make the TXT record change as shown below:

```
Please deploy a DNS TXT record under the name
_acme-challenge.myproxy.domain.com with the following value:

xLP4y_YJvdAK7_aZMJ50gkudTDeIC3rX0x83aNJctGw

Before continuing, verify the record is deployed.
Press Enter to Continue
Waiting for verification...
Cleaning up challenges

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/myproxy.domain.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/myproxy.domain.com/privkey.pem
   Your cert will expire on 2019-07-01. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
```


## Update Nginx Config

Now that we have our ssl certificates, we need to update our nginx config to enable ssl, redirect http to https and point the ssl certificates and ssl private keys to the certificates that we retrieved from letsencrypt.

Open up the virtual host nginx configuration:

```bash
$ vim /etc/nginx/conf.d/elasticsearch.conf
```

Update the config like the one below:

```
upstream elasticsearch {
    server 10.0.0.10:9200;
    server 10.0.0.11:9200;
    keepalive 15;
}

server {
  listen 80;
  server_name myproxy.domain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name myproxy.domain.com;

  ssl_certificate /etc/letsencrypt/live/myproxy.domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/myproxy.domain.com/privkey.pem;

  auth_basic "server auth";
  auth_basic_user_file /etc/nginx/passwords;

  location ^~ /.well-known/acme-challenge/ {
    auth_basic off;
  }

  location / {

    # deny node shutdown api
    if ($request_filename ~ "_shutdown") {
      return 403;
      break;
    }

    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;
    proxy_redirect off;
  }

  location = / {
    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;
    proxy_redirect off;
    auth_basic "off";
  }

  location ~* ^(/_cluster/health|/_cat/health) {
    proxy_pass http://elasticsearch;
    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;
    proxy_redirect off;
    auth_basic "off";
  }
}
```

Restart the nginx process:

```bash
$ systemctl restart nginx
```
## Test the Nginx Proxy with SSL

Test the proxy with HTTP so that we can see that our nginx config redirects us to HTTPS:

```bash
$ curl -iL -u 'admin:admin' http://myproxy.domain.com/_cat/nodes?v
HTTP/1.1 301 Moved Permanently
Server: nginx/1.14.0 (Ubuntu)
Date: Tue, 02 Apr 2019 21:40:09 GMT
Content-Type: text/html
Content-Length: 194
Connection: keep-alive
Location: https://myproxy.domain.com/_cat/nodes?v

HTTP/1.1 200 OK
Server: nginx/1.14.0 (Ubuntu)
Date: Tue, 02 Apr 2019 21:40:10 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 276
Connection: keep-alive

ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.0.0.10               40          97   3    0.15    0.10     0.08 mdi       -      Lq9P7eP
10.0.0.11               44          96   3    0.21    0.10     0.09 mdi       *      F5edOwK
```

Test the proxy with HTTPS:

```bash
$ curl -i -u 'admin:admin' https://myproxy.domain.com/_cat/nodes?v
HTTP/1.1 200 OK
Server: nginx/1.14.0 (Ubuntu)
Date: Tue, 02 Apr 2019 21:40:22 GMT
Content-Type: text/plain; charset=UTF-8
Content-Length: 276
Connection: keep-alive

ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.0.0.10               44          96   4    0.18    0.10     0.09 mdi       *      F5edOwK
10.0.0.11               39          97   5    0.13    0.09     0.08 mdi       -      Lq9P7eP
```

Setup a cronjob to auto renew the certificates:

```bash
$ crontab -e
```

Populate the following line:

```bash
6 1,13 * * * /usr/bin/certbot renew --post-hook "systemctl restart nginx" --quiet
```

## Resources:

- https://certbot.eff.org/lets-encrypt/ubuntuxenial-nginx.html

