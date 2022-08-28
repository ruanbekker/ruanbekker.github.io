---
layout: post
title: "Setup a WireGuard VPN Server on Linux"
date: 2020-01-11 23:37:03 +0200
comments: true
categories: ["vpn", "linux", "networking"] 
---

## Installation

I will be installing my wireguard vpn server on a ubuntu 18 server, for other distributions you can have a look at their [docs](https://www.wireguard.com/install/)

```
$ sudo add-apt-repository ppa:wireguard/wireguard
$ sudo apt update
$ sudo apt install wireguard -y
```

## Configuration

On the Server, create they keys directory where we will save our keys:

```
$ mkdir -p /etc/wireguard/keys
```

Create the private and public key:

```
$ wg genkey | tee privatekey | wg pubkey > publickey
```

Generate the pre-shared key:

```
$ wg genpsk > client.psk
```

On the client, create the keys directory:

```
$ mkdir -p ~/wireguard/keys
```

Create the private and public keys:

```
$ cd ~/wireguard/keys
$ wg genkey | tee privatekey | wg pubkey > publickey
```

Populate the server config:

```
$ cat /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <output-of-client.privatekey>
Address = 192.168.199.1/32
ListenPort = 8999
PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
PublicKey = <output-of-server.publickey>
PresharedKey = <output-of-client.psk>
AllowedIPs = 192.168.199.2/32
```

Populate the client config:

```
$ cat ~/wireguard/wg0.conf
[Interface]
PrivateKey = <output-of-client.privatekey>
Address = 192.168.199.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <output-of-server.publickey>
PresharedKey = <output-of-client.psk>
Endpoint = <server-public-ip>:8999
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

## Start the Server

On the server, enable and start the service:

```
$ systemctl enable wg-quick@wg0.service
$ wg-quick up wg0
```

On the client, connect the VPN:

```
$ wg-quick up ~/wireguard/wg0.conf
```

Verify the status:

```
$ wg show
interface: wg0
  public key: +Giwk8Y5KS5wx9mw0nEIdQODI+DsR+3TcbMxjJqfZys=
  private key: (hidden)
  listening port: 8999

peer: Q8LGMj6CeCYQJp+sTu74mLMRoPFAprV8PsnS0cu9fDI=
  preshared key: (hidden)
  endpoint: 102.132.208.80:57800
  allowed ips: 192.168.199.2/32
  latest handshake: 22 seconds ago
  transfer: 292.00 KiB received, 322.15 KiB sent
```

Check if you can ping the private ip address of the VPN:

```
$ ping 192.168.199.2
PING 192.168.199.2 (192.168.199.2): 56 data bytes
64 bytes from 192.168.199.2: icmp_seq=0 ttl=63 time=304.844 ms
```
