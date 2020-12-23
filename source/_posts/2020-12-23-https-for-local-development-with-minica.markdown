---
layout: post
title: "HTTPS for Local Development with MiniCA"
date: 2020-12-23 03:11:08 -0500
comments: true
categories: ["ssl", "certificates", "docker", "minica", "https"] 
---

In this tutorial we will use [minica](https://github.com/jsha/minica) to enable us to run our web applications over HTTPS for local development.

To read more about about [minica](https://github.com/jsha/minica) check out their website.

## Generate Certificates

You can use their binary from their github page or use my docker image to generate the certificates to a `./certs` directory:

```
$ docker run --user "$(id -u):$(id -g)" -it -v $PWD/certs:/output ruanbekker/minica --domains 192.168.0.20.nip.io
```

In the case from above, we are generating certificates for the FQDN `192.168.0.20.nip.io`. You will find the generated certificates under `./certs/`.

## Application Stack

We will use docker to create a nginx webserver to serve our content via https using the generated vertificates.

Our `docker-compose.yml`:

```
version: '3.7'
services:
  nginx:
    image: nginx
    container_name: nginx
    ports:
      - 80:80
      - 443:443
    volumes:
      - ~/personal/docker-minica-nginx/nginx.conf:/etc/nginx/nginx.conf
      - ~/personal/docker-minica-nginx/ssl.conf:/etc/nginx/conf.d/ssl.conf
      - ~/personal/docker-minica-nginx/certs/192.168.0.6.nip.io:/etc/nginx/certs
      - ~/personal/docker-minica-nginx/html/index.html:/usr/share/nginx/html/index.html
```

Our `nginx.conf`:

```
user  nginx;
worker_processes  1;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;
    include /etc/nginx/conf.d/ssl.conf;
}
```

Our `ssl.conf`:

```
server {
    listen 80;
    server_name 192.168.0.6.nip.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name 192.168.0.6.nip.io;

    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    location / {
        root   /usr/share/nginx/html;
        index  index.html;
    }
}
```

Our `html/index.html`:

```
<!DOCTYPE html>
<html lang="en-us">
<head>
    <meta charset="utf-8">
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.1.1.min.js" crossorigin="anonymous"></script>
    <title>Sample Page</title>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="bitProcessor"></div>
            <div class="col-md-12" style="background-color: white; position: absolute; top: 40%;width: 80%;left: 10%;">
                <center>
                    <h1>Hello, World!</h1>
				    <p>This is sample text.</p>
                </center>
            </div>
        </div>
    </div>
</body>
</html>
```

## Import Certificates

We have a certificate `./certs/minica.pem` which we need to import and trust on our local workstation, I am using a Mac so it will be Keychain Access.

![image](https://user-images.githubusercontent.com/567298/101961866-5a2ee500-3c13-11eb-9f89-03fa1bd4670d.png)

Once you open Keychain Access, select "file", "import items" and browse and import `./certs/minica.pem`, once you are done search for minica:

![image](https://user-images.githubusercontent.com/567298/101962064-d4f80000-3c13-11eb-9479-c043ba3ced2c.png)

Select the item, file -> get info, expand trust, change "when using this certificate" to Always trust and close.

You will now see the root ca is trusted:

![image](https://user-images.githubusercontent.com/567298/101962197-2dc79880-3c14-11eb-8d26-49874c9703fa.png)

## Boot the Application Stack

As we have `docker-compose.yml` in our current working directory, we can use docker-compose to boot our application:

```
$ docker-compose up
Creating network "docker-minica-nginx_default" with the default driver
Creating nginx ... done
Attaching to nginx
```

Now when we browse to `https://192.168.0.6.nip.io` we will see:

![image](https://user-images.githubusercontent.com/567298/101962367-a9c1e080-3c14-11eb-898b-688b50c1b9db.png)

And when we inspect the certificate, we can see its valid:

![image](https://user-images.githubusercontent.com/567298/101962411-c78f4580-3c14-11eb-80cd-cf8e449eca95.png)

## Thank You

Thank you for reading.
