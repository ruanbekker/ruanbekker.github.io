---
layout: post
title: "SSH Tools that comes in handy when dealing with Multiple Servers"
date: 2018-05-31 05:18:11 -0400
comments: true
categories: ["ssh", "linux", "tips", "authentication"]
---

![](https://objects.ruanbekker.com/assets/images/header-ssh-tips.png)

When dealing with a lot of servers where you need to ssh to different servers and especially if they require different authentication from different private ssh keys, it kinda gets annoying specifying the private key you need, when you want to SSH to them.

## SSH Config

SSH Config: `~/.ssh/config` is powerful! 

In this config file, you can specify the remote host, the key, user and the alias, so that when you want to SSH to it, you dont have to use the fully qualified domain name or IP address.

Let's take for example our server-a with the following details:

- FQDN: host1.eu.compute.domain.coom
- User: james
- PrivateKeyFile: /path/to/key.pem
- Disable Strict Host Checking

So to access that host, you would use the following command (without ssh config):

```bash
$ ssh -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null -i /path/to/key.pem james@host1.eu.compute.domain.com
```

Now with SSH Config, open up the config file:

``` 
$ vim ~/.ssh/config
``` 

and declare the host details:

```
Host host1
  Hostname host1.eu.compute.domain.com
  User james
  IdentityFile /path/to/key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

Now, if we need to SSH to it, we can do it as simply as:

```bash
$ ssh host1
```

as it will pull in the configs from the config that is described from the host alias that you calling from the argument of the ssh binary.

## SSH Timeout

Appending to our SSH Config, we can configure either our client or server to prevent SSH Timeouts due to inactivity.

- SSH Timeout on our Client:

```bash
$ vim ~/.ssh/config
```

Here we can set how often a NULL Packet is sent to the SSH Connections to keep the connection alive, in this case every 120 seconds:

```
ServerAliveInterval 120
```

- SSH Timeout on the Servers:

```bash
$ vim /etc/ssh/sshd_config
```

Below we have 2 properties, the interval of how often to instruct the client connected to send a NULL packet to keep the connection alive and the max number of intervals, so for a idle connection to timeout in 24 hours, we will take 86400 seconds which is 24 hours, divide into 120 second intervals, which gives as 720 intervals. 

So the config will look like this:

```
ClientAliveInterval 120
ClientAliveCountMax 720
```

The restart the sshd service:

```bash
$ /etc/init.d/sshd restart
```

## SSH Agent

Another handy tool is `ssh-agent`, if you have password encryption on your key, everytime you need to ssh, a password will be prompted. A way to get around this is to use the ssh-agent.

We also want to set a TTL to the ssh-agent, as we don't want it to run forever (unless you want it to). In this case I will let the ssh-agent exit after 2 hours. It will also only run in the shell session from where you execute it. Lets start up our ssh-agent:

```bash
$ eval $(ssh-agent -t 7200)
Agent pid 88760 
```

Now add the private key to the ssh-agent. If your private key is password protected, it will prompt you for the password and after successful verification the key will be added:

```
$ ssh-add /path/to/key.pem
Identity added: /path/to/key.pem (/path/to/key.pem)
```

## Multiple Github Accounts:

Here is a great post on how to work with different GitHub Accounts:
- https://gist.github.com/jexchan/2351996


