---
layout: post
title: "Installing Elastalert for Elasticsearch on Amazon Linux"
date: 2017-11-07 07:53:33 -0500
comments: true
categories: ["elasticsearch", "alerting", "monitoring", "aws"] 
---

Elastalert, a service for Alerting with Elasticsearch:

- https://github.com/Yelp/elastalert

## Setting up Elastalert

We will setup Elastalert for Elasticsearch on Amazon Linux which is a RHEL Based Distribution.

Setting up dependencies

```bash
$ sudo su
# yum update -y
# yum install git python-devel lib-devel libevent-devel bzip2-devel openssl-devel ncurses-devel zlib zlib-devel xz-devel gcc -y
# yum install python-setuptools -y
# easy_install pip
# pip install virtualenv
# virtualenv .venv
# source .venv/bin/activate
# pip install pip --upgrade
# pip install setuptools --upgrade
```

Clone Elastalert Repository and Install Dependencies:

```bash
$ cd /opt/
$ git clone https://github.com/Yelp/elastalert
$ cd elastalert/
$ pip install -r requirements.txt
```

Configs:

```bash
$ cp config.yaml.example config.yaml
$ vim config.yaml
$ vim example_rules/example_frequency.yaml
```

After opening the config, populate the configuration where needed.

Installation of elastalert:

```bash
$ python setup.py install
$ elastalert-create-index
```

Running elastalert:

```bash
$ python -m elastalert.elastalert --verbose --rule example_frequency.yaml
INFO:elastalert:Starting up
```

[Systemd](https://en.wikipedia.org/wiki/Systemd) Unit File:

``` /etc/systemd/system/elastalert.service
[Unit]
Description=Elastalert
# executed after this
After=syslog.target
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/elastalert
Environment="SOME_KEY_1=value" "SOME_KEY_2=value2"
# restart on unexpected exits
Restart=always
# first argument must be an absolute path, rest are arguments to it
ExecStart=/usr/bin/python -m elastalert.elastalert --verbose --rule example_frequency.yaml
# startup/shutdown grace period
TimeoutSec=60

[Install]
# executed before this
WantedBy=multi-user.target
# Thanks:
# https://cloudership.com/blog/2016/4/8/init-scripts-for-web-apps-on-linux-and-why-you-should-be-using-them
```

Reload, enable and start:

```bash
$ systemctl daemon-reload
$ systemctl enable elastalert.service
$ systemctl start elastalert.service
```
