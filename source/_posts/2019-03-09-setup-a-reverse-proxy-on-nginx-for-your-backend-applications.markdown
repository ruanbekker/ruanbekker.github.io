---
layout: post
title: "Setup a Reverse Proxy on Nginx for your Backend Applications"
date: 2019-03-09 17:50:32 -0500
comments: true
categories: ["nginx", "reverse-proxy", "flask", "http"] 
---
![](https://www.nginx.com/wp-content/uploads/2018/08/NGINX-logo-rgb-large.png)

Nginx is a great product! And today we will use nginx to setup a http reverse proxy to access our backend applications.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299";
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Our Setup

We will have a flask backend application listening on `127.0.0.1:5000` and our nginx reverse proxy will listen on `0.0.0.0:80` which will proxy requests through to our flask upstream.

## Our Backend Application

Our Flask application:

```
from flask import Flask
app = Flask(__name__)

@app.route('/')
def index():
    return 'Hello'

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
```

## Nginx

Install nginx:

```bash
$ apt install nginx -y
```

Our main nginx configuration:

```
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_names_hash_bucket_size 64;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
    ssl_prefer_server_ciphers on;
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    gzip on;
    gzip_disable "msie6";

    include /etc/nginx/conf.d/backend-*.conf;
}
```

Our application's configuration:

```
# /etc/nginx/conf.d/backend-flask.conf
upstream backend_flask {
    server 127.0.0.1:5000;
}

server {
    listen 80 default_server;
    listen [::]:80;
    server_name _;
	
    location / {
        include proxy_params;
        proxy_http_version 1.1;
        proxy_read_timeout 90;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://backend_flask;
        proxy_buffering off;
    }
}
```

Restart nginx and enable nginx on boot:

```bash
$ systemctl restart nginx
$ systemctl enable nginx
```

## Test your Application:

Access your server on port 80 and you should receive the response from your flask application:

```bash
$ curl http://nginx-public-ip:80/
Hello
```

## Resoures

- https://itnext.io/step-over-nginx-buffer-issue-94a498bedb82
