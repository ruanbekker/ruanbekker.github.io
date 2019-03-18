---
layout: post
title: "How to Setup a Nagios Monitoring Server"
date: 2019-03-13 17:53:42 -0400
comments: true
categories: ["nagios", "monitoring"]
---

![](https://user-images.githubusercontent.com/567298/54547916-65f26680-49af-11e9-8d42-e27c57ef8e2e.png)


Good old nagios! Nagios is a great Open Source Monitoring Server that monitors your servers and services/applications that is hosted on top of them, and has the ability to notify in the event when they go down.

I've been using Nagios for the last 7 years and worked for 3 business that chose Nagios as their preferred server monitoring solution.

## What we are doing today

Today we will setup a Nagios server and its plugins. The plugins helps to check different endpoints, such as custom tcp checks, ssh, snmp etc. 

In this nagios tutorial series, I will publish a couple of post which will include:

* Setup the Nagios Server and its Plugins - this post
* Setup the NRPE Server and NRPE Client Server (this is nice for local ports or custom checks)
* Setup Nagiosgraph (Graph performance data and add it as extra host configuration)
* Setup a custom Bash and Python Nagios Plugin for Custom Checks
* Setup a Telegram / Slack Plugin

## Installing Dependencies:

Go ahead and install all the dependencies needed by nagios and add the nagios user and group:

```bash
$ apt update
$ apt install build-essential libgd-dev openssl libssl-dev unzip apache2 -y
$ apt install autoconf gcc libc6 make wget unzip apache2 php libapache2-mod-php7.2 libgd-dev
$ apt install libmcrypt-dev libssl-dev bc gawk dc build-essential libnet-snmp-perl gettext
$ apt install libcarp-clan-perl rrdtool php-rrd libssl1.0-dev
$ useradd nagios
$ groupadd nagcmd
$ usermod -a -G nagcmd nagios
```

## Install Nagios

Download the nagios tarball from their website, have a look at [https://www.nagios.org/downloads/](https://www.nagios.org/downloads/) for the latest version.

```bash
$ wget -O nagios.tar.gz 'https://assets.nagios.com/downloads/nagioscore/releases/nagios-4.4.3.tar.gz?__hstc=118811158.7bdae752f04b6d927ddf150ae1ce5c71.1552389135285.1552394646569.1552410974898.3&__hssc=118811158.1.1552410974898&__hsfp=2323916385#_ga=2.246938692.1332751653.1552389134-913645931.1552389134'
```

Extract the archive:

```
$ tar xpf nagios*.tar.gz
$ cd nagios-4.4.3/
```

Configure with nagios user and nagcmd group, install and change the ownership of the generated data:

```
$ ./configure --with-nagios-group=nagios --with-command-group=nagcmd
$ make -j4 all
$ make install
$ make install-commandmode
$ make install-init
$ make install-config
$ /usr/bin/install -c -m 644 sample-config/httpd.conf /etc/apache2/sites-available/nagios.conf
$ usermod -a -G nagcmd www-data
```

## Install Nagios Plugins

Get the nagios plugins tarball, extract and install:

```
$ wget nagios-plugins.tar.gz 'https://nagios-plugins.org/download/nagios-plugins-2.2.1.tar.gz#_ga=2.250909126.1332751653.1552389134-913645931.1552389134'
$ tar xpf nagios-plugins*.tar.gz
$ cd nagios-plugins-2.2.1
$ ./configure --with-nagios-user=nagios --with-nagios-group=nagcmd --with-openssl
$ make -j4
$ make install
```

## Access Nagios

Enable apache modules:

```
$ a2enmod rewrite
$ a2enmod cgi
```

Setup basic auth for logging onto nagios:

```
$ htpasswd -c /usr/local/nagios/etc/htpasswd.users nagiosadmin
```

Setup a symlink for apache's nagios configuration

The configuration for the above will look more or less like the following:

```
$ cat /etc/apache2/sites-enabled/nagios.conf

...
         Require all granted
         AuthName "Nagios Access"
         AuthType Basic
         AuthUserFile /usr/local/nagios/etc/htpasswd.users
         Require valid-user
...
``` 

Create the systemd unit file for nagios `/etc/systemd/system/nagios.service`

```
[Unit]
Description=Nagios
BindTo=network.target

[Install]
WantedBy=multi-user.target

[Service]
Type=simple
User=nagios
Group=nagcmd
ExecStart=/usr/local/nagios/bin/nagios /usr/local/nagios/etc/nagios.cfg
```

Reload the daemon:

```
$ systemctl daemon-reload
```

Enable the service:

```
$ systemctl enable /etc/systemd/system/nagios.service
```

Ensure nagios is started:

```bash
$ systemctl restart nagios
$ systemctl restart apache2
```

Access nagios on http://nagios-ip/nagios with the credentials that you configured earlier.


## Up Next

In the next posts I will cover the following:

1. [Setup NagiosGraph for monitoring performance data](https://blog.ruanbekker.com/blog/2019/03/18/how-to-setup-the-nagiosgraph-plugin-on-nagios-monitoring-server/)
2. Show you how to create a custom nagios plugin in python
3. Create a Custom Notification service to send notifications to Telegram (or any API)

