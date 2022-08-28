---
layout: post
title: "Harden your SSH Security on Linux Servers"
date: 2020-12-18 13:32:18 +0000
comments: true
categories: ["security", "ssh", "linux"]
---

In this post we wil be focusing on increasing / hardening our security by adjusting our ssh configuration and applying some iptables firewall rules.

This will be the list of things that we will do:

```
  - Change the SSH Port
  - Don't allow root to SSH
  - Disable password based authentication
  - Enable key based authentication and only for a singular user
  - Allow our user to sudo
  - Use iptables to block sources trying to DDoS your server
```

## Packages

First let's install the packages that we need, I'm using Debian so I will be using the `apt` package manager:

```
$ apt update && apt upgrade -y
$ apt install sudo -y
```

## Dedicated User

Let's create our user james:

```
$ useradd -m -s /bin/bash james
```

Allow our user to sudo without a password, by running `visudo` then append the following line:

```
james ALL=(ALL:ALL) NOPASSWD: ALL
```

## SSH Authorized Keys

If you don't already have a private SSH key, generate one on your client side:

```
$ ssh-keygen -f ~/.ssh/james -t rsa -C "james" -q -N ""
```

Then copy the public key:

```
$ cat ~/.ssh/james.pub | pbcopy
```

On your server create the SSH directories:

```
$ mkdir /home/james/.ssh
```

Now paste your public key into `/home/james/.ssh/authorized_keys`

Then change the ownership:

```
$ chmod 700 /home/james/.ssh
$ chmod 644 /home/james/.ssh/authorized_keys
$ chown -R james:james /home/james
```

## SSH Config

Backup your SSH config:

```
$ cp /etc/ssh/sshd_config /etc/ssh_sshd_config.bak
```

We will be using the SSH port `2914`, replace your SSH config with the following and make your adjustments where you need to:

```
# /etc/ssh/sshd_config
Port 2914
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
LoginGraceTime 1m
PermitRootLogin no
MaxAuthTries 3
MaxSessions 5
AuthenticationMethods publickey
PubkeyAuthentication yes
AuthorizedKeysFile      /home/james/.ssh/authorized_keys
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
AllowUsers james
DenyUsers root
X11Forwarding yes
PrintMotd no
UseDNS no
PidFile /var/run/sshd.pid
AcceptEnv LANG LC_*
Subsystem       sftp    /usr/lib/openssh/sftp-server
```

Then save the file and restart SSH:

```
$ systemctl restart sshd
```

While you are still connected to the shell session, open up a new terminal and try to connect with your new user and private SSH key to ensure that you can connect to your server.

## Iptables

We want to drop incoming connections which make more than 10 connection attempts to SSH within 60 seconds.

The tokens get refilled into buckets at 3 per minute and maximum of 3 tokens that can be filled into the bucket.

Let's create our script:

```
$ mkdir -p /opt/scripts
$ touch /opt/scripts/fw.sh
```

In our script we will place the following content:

```
#!/usr/bin/env bash
INTERFACE=eth0 # check ifconfig to determine the correct interface
SSH_PORT=2914
CONNECTION_ATTEMPTS=10
CONNECTION_TIME=60
#WHITELIST_IP=x.x.x.x/32 # replace ip and uncomment if you want to whitelist a ip
#iptables -I INPUT -s ${WHITELIST_IP} -p tcp --dport ${SSH_PORT} -i ${INTERFACE} -j ACCEPT # uncomment if you want to use whitelisting
iptables -A INPUT -p tcp --dport ${SSH_PORT} -i ${INTERFACE} -m state --state NEW -m recent  --set
iptables -A INPUT -p tcp --dport ${SSH_PORT} -i ${INTERFACE} -m state --state NEW -m recent  --update --seconds ${CONNECTION_TIME} --hitcount ${CONNECTION_ATTEMPTS} -j DROP
iptables -A INPUT  -i ${INTERFACE} -p tcp --dport ${SSH_PORT} -m state --state NEW -m limit --limit 3/min --limit-burst 3 -j ACCEPT
iptables -A INPUT  -i ${INTERFACE} -p tcp --dport ${SSH_PORT} -m state --state ESTABLISHED -j ACCEPT
iptables -A OUTPUT -o ${INTERFACE} -p tcp --sport ${SSH_PORT} -m state --state ESTABLISHED -j ACCEPT
```

Now we want to execute this script whenever the server boots, open up `/etc/rc.local` and append the following line, so that the file looks more or less like:

```
#!/bin/bash
/opt/scripts/fw.sh
exit 0
```

Ensure both files are executable:

```
$ chmod +x /opt/scripts/fw.sh
$ chmod +x /etc/rc.local
```

When you are sure everything is in place, reboot:

```
$ reboot
```
