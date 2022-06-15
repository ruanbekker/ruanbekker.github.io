---
layout: post
title: "How to persist iptables rules after reboots"
date: 2022-06-15 06:10:12 -0400
comments: true
categories: ["security", "linux", "iptables"] 
---

![persist-iptables-after-reboot](https://blog.ruanbekker.com/images/ruanbekker-blog-persist-iptables.png)

In this tutorial we will demonstrate how to persist iptables rules across reboots.

## Rules Peristence

By default, when you create iptables rules its active, but as soon as you restart your server, the rules will be gone. Therefore we need to persist these rules across reboots.

## Dependencies

We require the package `iptables-persistent` and I will install it on a debian system so I will be using `apt`:

```bash
sudo apt update
sudo apt install iptables-persistent -y
```

Ensure that the service is enabled to start on boot:

```bash
sudo systemctl enable netfilter-persistent
```

## Creating Iptables Rules

In this case I will allow port 80 on TCP from all sources:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
```

To persist our current rules, we need to save them to `/etc/iptables/rules.v4` with `iptables-save`:

```bash
sudo iptables-save > /etc/iptables/rules.v4
```

Now when we restart, our rules will be loaded and our previous defined rules will be active.

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.


