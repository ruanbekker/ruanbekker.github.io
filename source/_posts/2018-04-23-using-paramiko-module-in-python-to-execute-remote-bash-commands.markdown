---
layout: post
title: "Using Paramiko module in Python to execute Remote Bash Commands"
date: 2018-04-23 12:16:59 -0400
comments: true
categories: ["paramiko", "ssh", "python"]
---

Paramiko is a python implementation of the sshv2 protocol. 

<a href="https://bekkerclothing.com/collections/developer?utm_source=blog.ruanbekker.com&utm_medium=blog&utm_campaign=leaderboard_ad" target="_blank"><img alt="bekker-clothing-developer-tshirts" src="https://user-images.githubusercontent.com/567298/70170981-7c278a80-16d6-11ea-9759-6621d02c1423.png"></a>

## Paramiko to execute Remote Commands:

We will use paramiko module in python to execute a command on our remote server.

Client side will be referenced as (side-a) and Server side will be referenced as (side-b)

## Getting the Dependencies:

Install Paramiko via pip on side-a:

```bash
$ pip install paramiko --user
```

## Using Paramiko in our Code:

Our Python Code:

```python
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname='192.168.10.10', username='ubuntu', key_filename='/home/ubuntu/.ssh/mykey.pem')

stdin, stdout, stderr = ssh.exec_command('lsb_release -a')

for line in stdout.read().splitlines():
    print(line)

ssh.close()
```

## Execute our Command Remotely:

Now we will attempt to establish the ssh connection from side-a, then run `lsb_release -a` on our remote server, side-b:

```bash
$ python execute.py

Distributor ID:	Ubuntu
Description:	Ubuntu 16.04.4 LTS
Release:	16.04
Codename:	xenial
```


