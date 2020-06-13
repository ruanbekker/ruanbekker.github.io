---
layout: post
title: "Using ProxyJump with SSH for VMs with No Public IPs"
date: 2020-06-13 20:06:35 +0200
comments: true
categories: ["ssh"] 
---

![ssh-proxy-jump](https://img.sysadmins.co.za/wngib2.png)

I have a dedicated server with LXD installed where I have a bunch of system containers running to host a lot of my playground services, and to access the operating system of those lxc containers, I need to SSH to the LXD host, then exec or ssh into that LXC container.

This became tedious and wanted a way to directly ssh to them, as they don't have public ip addresses, it's not possible but found its possible to access them using proxyjump.

```
[you] -> [hypervisor] -> [vm on hypervisor]
```

First step is to create our ssh key:

```
$ ssh-keygen -t rsa
```

Add the created public key (`~/.ssh/id_rsa.pub`) on the hypervisor and the target vm's `~/.ssh/authorized_key` files.

Then create the SSH Config on your local workstation (`~/.ssh/config`):

```
Host *
  StrictHostKeyChecking no
  UserKnownHostsFile=/dev/null

Host hypervisor
  Hostname hv.domain.com
  User myuser
  IdentityFile ~/.ssh/id_rsa

Host ctr1
  Hostname 10.37.117.132
  User root
  IdentityFile ~/.ssh/id_rsa
  ProxyJump hypervisor
```

Now accessing our lxc container ctr1, is possible by doing:

```
$ ssh ctr1
Warning: Permanently added 'x,x' (ECDSA) to the list of known hosts.
Warning: Permanently added '10.37.117.132' (ECDSA) to the list of known hosts.
root@ctr1~ $
```
