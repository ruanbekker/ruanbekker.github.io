---
layout: post
title: "How to Setup a Nagios Monitoring Server"
date: 2019-03-13 17:53:42 -0400
comments: true
categories: ["nagios", "monitoring"]
---

![](http://static1.tothenew.com/blog/wp-content/uploads/2016/05/Nagios-logo.jpg)

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

## Install Nagios NRPE

Nagios Remote Plugin Executor (NRPE) allows you to remotely execute Nagios plugins on other linux systems. This allows you to monitor remote machine metrics (disk usage, CPU, local listening services, etc.).

NRPE has 2 sections:

1. The nagios server side.
2. The client side.

For nagios to execute remote plugins, the client configuration needs to allow the nrpe server which will be nagios.

Download, extract, configure and install NRPE server:

```
$ wget 'https://github.com/NagiosEnterprises/nrpe/releases/download/nrpe-3.2.1/nrpe-3.2.1.tar.gz'
$ tar -xvf nrpe-3.2.1.tar.gz
$ cd nrpe-3.2.1
$ ./configure --enable-command-args --with-nagios-user=nagios --with-nagios-group=nagcmd --with-ssl=/usr/bin/openssl --with-ssl-lib=/usr/lib/x86_64-linux-gnu
$ make all
$ make install
$ make install-init
$ make install-config
$ systemctl enable nrpe.service
```

Installing NRPE on the client side:

```
$ apt update && apt install nagios-nrpe-server -y
$ systemctl enable nagios-nrpe-server
$ systemctl start nagios-nrpe-server
```

Allow your nagios server ip in `/etc/nagios/nrpe.cfg`:

```
allowed_hosts=nagios.ip.in.here
```

Restart NRPE on the client:

```
$ systemctl restart nagios-nrpe-server
```

Ensure that the `check_nrpe` plugin is configured and available in the commands.cfg configuration for the nagios server:

```
$ vi /usr/local/nagios/etc/objects/commands.cfg

define command {
    command_name check_nrpe
    command_line $USER1$/check_nrpe -H $HOSTADDRESS$ -c $ARG1$
}
```

Check [this]() out how to create a python nrpe nagios plugin to check disk space on the client host

## Access Nagios

Ensure nagios is started:

```bash
$ systemctl restart nagios
$ systemctl restart apache2
```

Access nagios on http://nagios-ip/nagios . The default user is `nagiosadmin` and password `nagiosadmin`

## Configure Nagios to Monitor our first Host

I like to setup an isolated path for my custom host/service configigurations. First we will declare the configuration path for our servers. 

Open up: `/usr/local/nagios/etc/nagios.cfg` and add a new cfg_dir:

```
cfg_dir=/usr/local/nagios/etc/servers
```

Now, create the directory:

```
$ mkdir /usr/local/nagios/etc/servers
```

Let's say we want to configure a web server named web01 that sits at the location 10.10.10.10:


```
$ vi /usr/local/nagios/etc/servers/webservers.cfg
```

First we define our host configuration:

1. We are using the `linux-server` template that is defined in `/usr/local/nagios/etc/objects/templates.cfg`
2. We set the hostname, alias and address as well as notification prediods

```
define host {
    use                      linux-server
    host_name                WEB01
    alias                    WEB01
    address                  10.10.10.10
    max_check_attempts       5
    check_period             24x7
    notification_interval    30
    notification_period      24x7
}
```

While you have the config open, we want to define the services that we would like to monitor, and associate the services to the host that we defined.

In this example, we want to ping the server and check port tcp 22 and 80. Ensure that your web server is allowing the mentioned ports from the nagios server ip.

In the config, we are declaring the following:

1. Use the `generic-service` template
2. Map the hostname which the service should be associated to
3. The description that you will see in nagios
4. Use the check_ping / check_ssh / check_http plugin and set the thresholds for ok, warning, critical

```
define service {
    use                    generic-service
    host_name              WEB01
    service_description    PING
    check_command          check_ping!100.0,20%!500.0,60%
}

define service {
    use                      generic-service
    host_name                WEB01
    service_description      SSH
    check_command            check_ssh
    notifications_enabled    1
}

define service {
    use                      generic-service
    host_name                WEB01
    service_description      HTTP
    check_command            check_http
    notifications_enabled    1
}
```

Save the config, test the config:

```
$ /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios
```

If you don't see any errors, go ahead and restart to apply the configs:

```
$ systemctl restart nagios
$ systemctl restart apache2
```

Head over to nagios user interface at http://nagios-ip/nagios and you should see that the services are scheduled to be checked and should be reflecting in a minute or two.

## Up Next

In the next posts I will cover the following:

1. Setup NagiosGraph for monitoring performance data
2. Show you how to create a custom nagios plugin in python
3. Create a Custom Notification service to send notifications to Telegram (or any API)

