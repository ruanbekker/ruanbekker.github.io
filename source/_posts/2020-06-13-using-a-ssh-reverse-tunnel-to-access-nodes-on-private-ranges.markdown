---
layout: post
title: "Using a SSH Reverse Tunnel to Access Nodes on Private Ranges"
date: 2020-06-13 19:59:27 +0200
comments: true
categories: ["ssh", "tunneling", "networking"] 
---

![ssh-tunneling](https://img.sysadmins.co.za/wngib2.png)

Personal utility (actually just a command) that I use to reach my Raspberry Pi Nodes that has no direct route via the Internet

## Other Projects

There's a lot of other tools out there that's already solving this issue, such as [inlets](https://inlets.dev), but I wanted my own, so that I can extend features to it as it pleases me.

## Overview

This is more ore less how it looks like:

```
[VPS] <-- Has a Public IP
 |
 |
 [HOME NETWORK] <-- Dynamic IP
   |
   |
 [rpi-01:22], [rpi-02:22] <-- Private IPs
```

- SSH Tunnel is setup from the Raspberry Pi Nodes
- Each Raspberry Pi sets up a unique port on the VPS for the tunnel to traverse to the Rpi on port 22
- To reach Rpi-01, you hop onto the VPS and ssh to localhost port 2201
- To reach Rpi-02, you hop onto the VPS and ssh to localhost port 2202, etc

## Progress

The tool will still be built, but using ssh it's quite easy

## Usage

Setup the SSH Reverse Tunnel from rpi-01:

```
$ ssh -i ~/.ssh/bastion.pem \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  -o ServerAliveInterval=60 \
  -N -R 2201:localhost:22 \
  -p 22 ruan@bastion-9239.domain.cloud
```

Setup the SSH Reverse Tunnel from rpi-02:

```
$ ssh -i ~/.ssh/bastion.pem \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  -o ServerAliveInterval=60 \
  -N -R 2202:localhost:22 \
  -p 22 ruan@bastion-9239.domain.cloud
```

On the VPS, we can see that we have port 2021 and 2022 listening:

```
$ netstat -tulpn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.1:2201          0.0.0.0:*               LISTEN      -
tcp        0      0 127.0.0.1:2202          0.0.0.0:*               LISTEN      -
```

To connect to rpi-01, we ssh to localhost on port 2201, from the VPS:

```
$ ssh -p 2201 pi@localhost
pi@rpi-01:~ $
```

To connect to rpi-02, we ssh to localhost on port 2202 from the VPS:

```
$ ssh -p 2202 pi@localhost
pi@rpi-02:~ $
```
