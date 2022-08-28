---
layout: post
title: "Building a Alpine Nginx PHP-Fpm Image on Docker for PHP Applications"
date: 2017-08-26 20:41:16 -0400
comments: true
categories: ["docker", "alpine", "php", "nginx"] 
---

A Post on Building a Alpine Based Image that will serve PHP Pages, using Nginx and PHP-FPM5. 

I have a lot of modules enabled, which might not be neccesary, but in my case I wanted to have a couple of them enabled, for testing.

## One of the Requirements:

One of the requirements was that I needed SMTP support from the container as I am using [Startbootstrap Freelancer Theme](https://startbootstrap.com/template-overviews/freelancer/), which I configured to relay mail from the contact from to one of my external relay hosts.

## Our Directory Structure:

Our data that we will be working with will consist of our `Dockerfile`, our `website files`, `nginx config`, and a `wrapper script` that will control nginx and php-fpm5 processes:

```bash Directory Structure
.
|-- Dockerfile
|-- README.md
|-- html
|   |-- css
|   |-- fonts
|   |-- img
|   |-- index.html
|   |-- js
|   `-- mail
|       `-- contact.php
|-- nginx.conf
|-- start_nginx.sh
|-- start_php-fpm5.sh
`-- wrapper.sh
```

## Going into Some Detail:

First, our `Dockerfile`, which you will see I started the image from Apline:

```docker Dockerfile
FROM alpine:edge

RUN apk update \
    && apk add nginx \
    && adduser -D -u 1000 -g 'www' www \
    && mkdir /www \
    && chown -R www:www /var/lib/nginx \
    && chown -R www:www /www \
    && rm -rf /etc/nginx/nginx.conf

ENV PHP_FPM_USER="www"
ENV PHP_FPM_GROUP="www"
ENV PHP_FPM_LISTEN_MODE="0660"
ENV PHP_MEMORY_LIMIT="512M"
ENV PHP_MAX_UPLOAD="50M"
ENV PHP_MAX_FILE_UPLOAD="200"
ENV PHP_MAX_POST="100M"
ENV PHP_DISPLAY_ERRORS="On"
ENV PHP_DISPLAY_STARTUP_ERRORS="On"
ENV PHP_ERROR_REPORTING="E_COMPILE_ERROR\|E_RECOVERABLE_ERROR\|E_ERROR\|E_CORE_ERROR"
ENV PHP_CGI_FIX_PATHINFO=0
ENV TIMEZONE="Africa/Johannesburg"

RUN apk add curl \
    ssmtp \
    tzdata \
    php5-fpm \
    php5-mcrypt \
    php5-soap \
    php5-openssl \
    php5-gmp \
    php5-pdo_odbc \
    php5-json \
    php5-dom \
    php5-pdo \
    php5-zip \
    php5-mysql \
    php5-mysqli \
    php5-sqlite3 \
    php5-pdo_pgsql \
    php5-bcmath \
    php5-gd \
    php5-odbc \
    php5-pdo_mysql \
    php5-pdo_sqlite \
    php5-gettext \
    php5-xmlreader \
    php5-xmlrpc \
    php5-bz2 \
    php5-iconv \
    php5-pdo_dblib \
    php5-curl \
    php5-ctype

RUN sed -i "s|;listen.owner\s*=\s*nobody|listen.owner = ${PHP_FPM_USER}|g" /etc/php5/php-fpm.conf \
    && sed -i "s|;listen.group\s*=\s*nobody|listen.group = ${PHP_FPM_GROUP}|g" /etc/php5/php-fpm.conf \
    && sed -i "s|;listen.mode\s*=\s*0660|listen.mode = ${PHP_FPM_LISTEN_MODE}|g" /etc/php5/php-fpm.conf \
    && sed -i "s|user\s*=\s*nobody|user = ${PHP_FPM_USER}|g" /etc/php5/php-fpm.conf \
    && sed -i "s|group\s*=\s*nobody|group = ${PHP_FPM_GROUP}|g" /etc/php5/php-fpm.conf \
    && sed -i "s|;log_level\s*=\s*notice|log_level = notice|g" /etc/php5/php-fpm.conf \
    && sed -i 's/include\ \=\ \/etc\/php5\/fpm.d\/\*.conf/\;include\ \=\ \/etc\/php5\/fpm.d\/\*.conf/g' /etc/php5/php-fpm.conf

RUN sed -i "s|display_errors\s*=\s*Off|display_errors = ${PHP_DISPLAY_ERRORS}|i" /etc/php5/php.ini \
    && sed -i "s|display_startup_errors\s*=\s*Off|display_startup_errors = ${PHP_DISPLAY_STARTUP_ERRORS}|i" /etc/php5/php.ini \
    && sed -i "s|error_reporting\s*=\s*E_ALL & ~E_DEPRECATED & ~E_STRICT|error_reporting = ${PHP_ERROR_REPORTING}|i" /etc/php5/php.ini \
    && sed -i "s|;*memory_limit =.*|memory_limit = ${PHP_MEMORY_LIMIT}|i" /etc/php5/php.ini \
    && sed -i "s|;*upload_max_filesize =.*|upload_max_filesize = ${PHP_MAX_UPLOAD}|i" /etc/php5/php.ini \
    && sed -i "s|;*max_file_uploads =.*|max_file_uploads = ${PHP_MAX_FILE_UPLOAD}|i" /etc/php5/php.ini \
    && sed -i "s|;*post_max_size =.*|post_max_size = ${PHP_MAX_POST}|i" /etc/php5/php.ini \
    && sed -i "s|;*cgi.fix_pathinfo=.*|cgi.fix_pathinfo= ${PHP_CGI_FIX_PATHINFO}|i" /etc/php5/php.ini
    && sed -i 's/smtp_port\ =\ 25/smtp_port\ =\ 81/g' /etc/php5/php.ini \
    && sed -i 's/SMTP\ =\ localhost/SMTP\ =\ mail.bekkersolutions.com/g' /etc/php5/php.ini \
    && sed -i 's/;sendmail_path\ =/sendmail_path\ =\ \/usr\/sbin\/sendmail\ -t/g' /etc/php5/php.ini 

RUN rm -rf /etc/localtime \
    && ln -s /usr/share/zoneinfo/${TIMEZONE} /etc/localtime \
    && echo "${TIMEZONE}" > /etc/timezone \
    && sed -i "s|;*date.timezone =.*|date.timezone = ${TIMEZONE}|i" /etc/php5/php.ini \ 
    && echo 'sendmail_path = "/usr/sbin/ssmtp -t "' > /etc/php5/conf.d/mail.ini \
    && sed -i 's/mailhub=mail/mailhub=mail.domain.com\:81/g' /etc/ssmtp/ssmtp.conf 

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.php /www/index.php
COPY test.html /www/test.html
COPY start_nginx.sh /start_nginx.sh
COPY start_php-fpm5.sh /start_php-fpm5.sh
COPY wrapper.sh /wrapper.sh

RUN chmod +x /start_nginx.sh /start_php-fpm5.sh /wrapper.sh

CMD ["/wrapper.sh"]
```

Next, our `nginx.conf` configuration file:

```nginx nginx.conf
user                            www;
worker_processes                1;

error_log                       /var/log/nginx/error.log warn;
pid                             /var/run/nginx.pid;

events {
    worker_connections          1024;
}

http {
    include                     /etc/nginx/mime.types;
    default_type                application/octet-stream;
    sendfile                    on;
    access_log                  /var/log/nginx/access.log;
    keepalive_timeout           3000;

    server {
        listen                  80;
        root                    /www;
        index                   index.html index.htm index.php;
        server_name             _;
        client_max_body_size    32m;
        error_page              500 502 503 504  /50x.html;

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

Then our directory, `html`  that will consist our websites data, for a simple example, I will create a sample `index.php` page which can be used:

```php html/index.php
<?php
$word = "foo";
echo "The word is: $word\n";
?>
```

Then, following our `wrapper.sh` script that will start our `php-fpm5`, and `nginx` processes, and then monitor these processes, if one of the processes have to exit, the wrapper script will return a exit code, which will result the container to exit, if there is anything wrong with the service: 

The PHP-FPM script:

```bash start_php-fpm5.sh
#!/bin/sh
/usr/bin/php-fpm5
```

The Nginx Script:

```bash start_nginx.sh
#!/bin/sh
/usr/sbin/nginx -c /etc/nginx/nginx.conf
```

The Wrapper Script:

```bash wrapper.sh
#!/bin/sh

/start_php-fpm5.sh -D
status=$?
if [ $status -ne 0 ]; then
  echo "php-fpm5 Failed: $status"
  exit $status
  else echo "Starting PHP-FPM: OK"
fi

sleep 2

/start_nginx.sh -D
status=$?
if [ $status -ne 0 ]; then
  echo "Nginx Failed: $status"
  exit $status
  else echo "Starting Nginx: OK"
fi

sleep 2

while /bin/true; do
  ps aux | grep 'php-fpm: master process' | grep -q -v grep
  PHP_FPM_STATUS=$?
  echo "Checking PHP-FPM, Status Code: $PHP_FPM_STATUS"
  sleep 2

  ps aux | grep 'nginx: master process' | grep -q -v grep
  NGINX_STATUS=$?
  echo "Checking NGINX, Status Code: $NGINX_STATUS"
  sleep 2

  if [ $PHP_FPM_STATUS -ne 0 ];
    then
      echo "$(date +%F_%T) FATAL: PHP-FPM Raised a Status Code of $PHP_FPM_STATUS and exited"
      exit -1

   elif [ $NGINX_STATUS -ne 0 ];
     then
       echo "$(date +%F_%T) FATAL: NGINX Raised a Status Code of $NGINX_STATUS and exited"
       exit -1

   else
     sleep 2
        echo "$(date +%F_%T) - HealtCheck: NGINX and PHP-FPM: OK"
  fi
  sleep 60
done
```

## Building the Image:

I am primarily using docker swarm, so I am building the image, and pushing to a private registry:

```bash Build and Push the Image
$ docker build -t registry.gitlab.com/<user>/<repo>/alpine:php5 .
$ docker push registry.gitlab.com/<user>/<repo>/alpine:php5
```

Create the PHP Service:

```bash Create a Docker Service
$ docker service create \
--name php-app \
--network appnet \
--replicas 3 \
--with-registry-auth registry.gitlab.com/<user>/<repo>/alpine:php5
```

For a Container from the Image on the Host:

```bash Run a Container from the Image
$ docker run -itd --name php-app -p 80:80 registry.gitlab.com/<user>/<repo>/alpine:php5
```

Test the Web App:

```bash Make a GET Request
$ curl -XGET http://127.0.0.1:80/
The word is: foo
```


