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

