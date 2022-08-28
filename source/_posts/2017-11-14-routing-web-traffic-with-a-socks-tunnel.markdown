---
layout: post
title: "Routing Web Traffic with a SOCKS Tunnel"
date: 2017-11-14 10:17:07 -0500
comments: true
categories: ["ssh", "socks", "proxy", "tunnel"] 
---

I wanted to access a Non Standard HTTP Port on one of my RaspberryPi Hosts, which was not directly available to the Internet, so I have chosen to establish a SOCKS Tunnel to achieve that.

## Web Application on my LAN

Getting my RaspberryPi's Private IP Address:

```bash
$ ifconfig eth0 | grep 'inet 192' | awk '{print $2}'
192.168.1.118
```

For demonstration purposes, I will use Python's SimpleHTTPServer:

```bash
$ mkdir web
$ cd web
$ echo 'yeehaa' > index.html
$ python -m SimpleHTTPServer 5050
Serving HTTP on 0.0.0.0 port 5050 ...
```

## Establish the SOCKS Tunnel

From my laptop, establishing the SOCKS Tunnel with SSH, you can use `-f` to fork it in the background:

```bash
$ ssh -D 8157 -CqN user@home.domain.com
```

## Configure your Browser:

Configure your browser to Proxy via:

- Host: localhost
- Port: 8157

Now when you access the destined host's private ip, you will get a response:

```bash
Browse to http://192.168.1.118:5050/ and in my case my response is:
-> yeehaa
```
