---
layout: post
title: "How to do Port Forwarding with Iptables"
date: 2020-04-27 13:42:41 +0200
comments: true
categories: ["iptables", "networking"]
---

This is a quick post on how to do port forwarding with iptables on linux.

## What would we like to achieve

We have a lxc container running a **redis** server and we would like to do port forwarding so that we can reach the server over the internet

## LXC Host

On our host that hosts our lxc containers, we want to forward the host port `5379` to `6379` of the container (10.37.117.37), so we can connect on a non-standard redis port:

```
$ iptables -t nat -I PREROUTING -p tcp --dport 5379 -j DNAT --to-destination 10.37.117.37:6379
```

## Test over the Internet

Test the connection by connecting to the LXC Host's IP:

```
$ redis-cli -h lxc.host.ip.address -p 5379 -a "${REDIS_PW}"  get test
"It's working!"
```

## Thank You

Thanks for reading my short post on how to use iptables to do port forwarding.
