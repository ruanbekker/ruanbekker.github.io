---
layout: post
title: "Setup a Peer to Peer VPN with VPNCloud on Ubuntu"
date: 2018-06-02 14:15:33 -0400
comments: true
categories: ["vpn", "networking"] 
---

So I got 3 Dedicated Servers each having its own Static IP and I wanted a way to build a private network between these servers. 

## The Scenario:

3 Servers with the following IP's (not real IP addresses):

```
- Server 1: 52.1.99.10
- Server 2: 52.1.84.20
- Server 3: 52.1.49.30
```

So I want to have a private network, so that I can have the following internal network:

```
- Server 1: 10.0.1.1
- Server 2: 10.0.1.2
- Server 3: 10.0.1.3
```

A couple of years ago, I accomplished the end goal using GRE Tunnels, which works well, but wanted to try something different.

## VPNCloud

So I stumbled upon VPNCloud.rs, which is a peer to peer VPN. Their description, quoted from their Github page:

"VpnCloud is a simple VPN over UDP. It creates a virtual network interface on the host and forwards all received data via UDP to the destination. VpnCloud establishes a fully-meshed VPN network in a peer-to-peer manner. It can work on TUN devices (IP based) and TAP devices (Ethernet based)."

This is exactly what I was looking for.

## Setting up a 3 node Private Network:

Given the IP configuration above, we will setup a Private network between our 3 hosts. 

Do some updates then grab the package from [Github](https://github.com/dswd/vpncloud.rs/releases) and install VPNCloud:

```bash 
$ apt update && apt ugprade -y
$ wget https://github.com/dswd/vpncloud.rs/releases/download/v0.8.1/vpncloud_0.8.1_amd64.deb
$ dpkg -i ./vpncloud_0.8.1_amd64.deb
```

Let's start the configuration on Server-1, this config should also be setup on the other 2 servers, the config will remain the same, except for the `ifup` command. The other servers will look like:

```
Server-2: -> ifup: "ifconfig $IFNAME 10.0.1.2/24 mtu 1400"
Server-3: -> ifup: "ifconfig $IFNAME 10.0.1.3/24 mtu 1400"
```

Getting back to the Server-1 config:

```bash
$ vim /etc/vpncloud/private.net
```

Example Config that I am using:

```
# each vpn running on their own port
port: 3210

# members of our private network
peers:
  - srv2.domain.com:3210
  - srv3.domain.com:3210

# timeouts
peer_timeout: 1800
dst_timeout: 300

# token that identifies the network and helps to distinguish from other networks
magic: "1234abcd"

# pre shared key
shared_key: "VeryStrongPreSharedKey_ThatShouldBeChanged"

# encryption
crypto: aes256

# device info
device_name: "vpncloud%d"
device_type: tap

# vpn modes: hub / switch / router / normal
mode: normal

# subnet to be used for our private network
subnets:
  - 10.0.1.0/24

# command to setup the network
ifup: "ifconfig $IFNAME 10.0.1.1/24 mtu 1400"
ifdown: "ifconfig $IFNAME down"

# user/group owning the process
user: "root"
group: "root"
```

Repeat the config on the other servers.

## Start the VPN Service:

Restart the VPNCloud Service on all the Servers:

```bash
$ service vpncloud@private start
```

Check the status:

```bash
$ service vpncloud@private status
```

Check if the interface is up:

```bash
$ ifconfig vpncloud0
vpncloud0 Link encap:Ethernet  HWaddr aa:bb:cc:dd:ee:ff
          inet addr:10.0.1.1  Bcast:10.0.1.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1400  Metric:1
          RX packets:55 errors:0 dropped:0 overruns:0 frame:0
          TX packets:71 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:5046 (5.0 KB)  TX bytes:5526 (5.5 KB)
```

Ping the 3rd server via the private network:

```bash
$ ping -c 3 10.0.1.3
PING 10.0.1.2 (10.0.1.3) 56(84) bytes of data.
64 bytes from 10.0.1.3: icmp_seq=1 ttl=64 time=0.852 ms
64 bytes from 10.0.1.3: icmp_seq=2 ttl=64 time=0.831 ms
64 bytes from 10.0.1.3: icmp_seq=3 ttl=64 time=0.800 ms

--- 10.0.1.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2028ms
rtt min/avg/max/mdev = 0.800/0.827/0.852/0.039 ms
```

Awesome service, please check their [Github Repo](https://github.com/dswd/vpncloud.rs) out.
