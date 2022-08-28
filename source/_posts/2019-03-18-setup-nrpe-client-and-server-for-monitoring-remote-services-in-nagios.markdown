---
layout: post
title: "Setup NRPE Client and Server for Monitoring Remote Services in Nagios"
date: 2019-03-18 12:49:59 -0400
comments: true
categories: ["nagios", "monitoring", "nrpe"]
---

![](https://user-images.githubusercontent.com/567298/54547916-65f26680-49af-11e9-8d42-e27c57ef8e2e.png)

If you have not setup the [Nagios Server](https://blog.ruanbekker.com/blog/2019/03/13/how-to-setup-a-nagios-monitoring-server/) have a look at that link to setup the Nagios server.

## Nagios NRPE

Nagios Remote Plugin Executor (NRPE) allows you to remotely execute Nagios plugins on other linux systems. This allows you to monitor remote machine metrics (disk usage, CPU, local listening services, etc.).

NRPE has 2 sections:

- The nagios server side.
- The client side.

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
