---
layout: post
title: "SSH Tools that comes in handy when dealing with Multiple Servers"
date: 2018-05-31 05:18:11 -0400
comments: true
categories: ["ssh", "linux", "tips", "authentication"]
---

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


