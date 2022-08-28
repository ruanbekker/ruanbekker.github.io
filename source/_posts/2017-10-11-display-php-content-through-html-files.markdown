---
layout: post
title: "Display PHP Content through HTML files"
date: 2017-10-11 02:43:55 -0400
comments: true
categories: ["html", "php", "nginx"] 
---

While I was working with a root index page which is in `HTML` that had `PHP` content in, it did not render all of the `PHP` and some content was displayed as text, instead of rendered.


## The Issue:

Some `PHP` content not rendered, as I am seeing this at the top of the page as plain text:

```php
; somePhpFunction(); ?>
```

## My Nginx Config:

```bash nginx.conf
http {
    include                     /etc/nginx/mime.types;
    default_type                application/octet-stream;
    sendfile                    on;
    access_log                  /var/log/nginx/access.log;
    keepalive_timeout           3000;

    proxy_cache_path /var/cache/nginx/ levels=1:2 keys_zone=nginx_cache:10m max_size=16m inactive=60m;

    server {
        listen                  80;
        root                    /www;
        index                   index.php index.html index.htm;
        server_name             _;
        client_max_body_size    32m;
        error_page              500 502 503 504  /50x.html;
        proxy_cache 		nginx_cache;
        add_header 		X-Proxy-Cache "public";

        location = /50x.html {
              root              /var/lib/nginx/html;
        }

        location ~ \.php$ {
              fastcgi_pass      127.0.0.1:9000;
              fastcgi_index     index.php;
              include           fastcgi.conf;
        }
    }
}
```

## The Fix:

a `.htaccess` had to be placed in my root directory of the website:

```bash .htaccess
AddType application/x-httpd-php .html .htm
```

After that was in place, all of the `PHP` was rendered 
