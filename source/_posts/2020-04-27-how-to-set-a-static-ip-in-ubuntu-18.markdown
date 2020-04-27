---
layout: post
title: "How to set a Static IP in Ubuntu 18"
date: 2020-04-27 13:39:19 +0200
comments: true
categories: ["ubuntu", "linux", "networking"] 
---

This is a short post on how to set a **static ip address** on **ubuntu 18.04** using **netplan**

## Netplan

At the moment my network interfaces uses dhcp, and we can see that below:

```
$ cat /etc/netplan/50-cloud-init.yaml
network:
    version: 2
    ethernets:
        eth0:
            dhcp4: true
```

Changing the configuration to static:

```
$ cat /etc/netplan/50-cloud-init.yaml
network:
    version: 2
    ethernets:
        eth0:
            dhcp4: false
            addresses: [10.37.117.37/24]
            gateway4: 10.37.117.1
            nameservers:
                addresses: [127.0.0.53,8.8.8.8]
```

After changing the configuration, you need to apply your changes:

```
$ netplan apply
```

## Thank You

Thank you for reading my short post on how to change a static ip address on ubuntu 18.04 using netplan
