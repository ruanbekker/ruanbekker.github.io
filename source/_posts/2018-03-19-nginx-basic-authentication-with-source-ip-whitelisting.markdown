---
layout: post
title: "Nginx Basic Authentication with Source IP Whitelisting"
date: 2018-03-19 10:57:36 -0400
comments: true
categories: ["nginx", "authentication"] 
---

Quick post on how to setup HTTP Basic Authentication and whitelist IP Based Sources to not get prompted for Authentication.

This could be useful for systems interacting with Nginx, so that they don't have to provide authentication. 

## Dependencies:

Install nginx and the package required to create the auth file:

```
$ apt install nginx apache2-utils -y
```

Create the Password file:

```
$ htpasswd -c /etc/ngins/secrets admin
```

## Configuration:

Create the site config:

```
$ rm -rf /etc/nginx/conf.d/*.conf
$ vim /etc/nginx/conf.d/default.conf
```

```
server {
    listen       80;
    server_name  localhost;

    location / {
        satisfy any;
        allow 127.0.0.1;
        deny all;

        auth_basic "restricted";
        auth_basic_user_file /etc/nginx/secrets;
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

Reload the Changes:

```
$ nginx -s reload
```

## Testing:

Testing from our Whitelisted location (localhost):

```
curl -i http://127.0.0.1 
HTTP/1.1 200 OK
```

Testing from remote location:

```
$ curl -i http://localhost
HTTP/1.1 401 Unauthorized

$ curl -i http://admin:password@localhost
HTTP/1.1 200 OK
``` 
