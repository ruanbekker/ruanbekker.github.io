---
layout: post
title: "IPSec Site to Site VPN with Dynamic IPs with Openswan"
date: 2020-04-19 20:58:17 +0200
comments: true
categories: ["strongswan", "ipsec", "vpn", "networking"] 
---

In this tutorial we will setup a site to site ipsec vpn with strongswan and we will enable each server to discover the other vpn server via dynamic dns. We will also append to our config the ability of roadwarriors so that you will be able to connect to your homelab from any mobile or laptop device from any remote source.

## Some background

Me and one of my friends decided to build a site to site vpn with strongswan so that our homelabs could be reachable to each other over private networks. 

One challenge that I thought of is that both of our internet providers don't support static ip addressing, so each vpn server needs to know where to connect to whenever the ip address changes.

## What we will be doing

We will setup strongswan vpn on both servers and allow the private LAN ranges to be reachable for both sides. As I have a domain hosted on cloudflare, I will be using cloudflare's api to update the A record of each sides dns whenever the IP changes.

## Environment

On my side, which I will be referring to as **Side-A**:

```
Public DNS Name: side-a.example.com
Private Range: 192.168.0.0/24
VPN Server IP: 192.168.0.2
```

On my friend's side, which I will be referring to as **Side-B**:

```
Public DNS Name: side-b.example.com
Private Range: 192.168.1.0/24
VPN Server IP: 192.168.1.2
```

## Cloudflare Dynamic DNS

You don't need to use Cloudflare, theres services such as dyndns.com, no-ip.com. But for this tutorial I will be using cloudflare to utilize my own domain.

I will be using the [cloudflare-ddns-client](https://github.com/LINKIWI/cloudflare-ddns-client)

First we need to create a API Token, head over to your dashboard: [dash.cloudflare.com](https://dash.cloudflare.com), head over to "my profile", select "API Tokens", then allow "Read Zones" and "Edit DNS", then select "Create Token". Keep the returned token value in a safe place.

Install the pre-requirements:

```
$ apt install python python-dev python-pip make curl build-essential -y
```

Get the source and install:

```
$ git clone https://github.com/LINKIWI/cloudflare-ddns-client.git
$ cd cloudflare-ddns-client
$ make install
```

We will now configure the cloudflare dynamic dns client, this will be done on both sides, but will only demonstrate for side-a:

```
$ cloudflare-ddns --configure
Use API token or API key to authenticate?
Choose [T]oken or [K]ey: T
Enter the API token you created at https://dash.cloudflare.com/profile/api-tokens.
Required permissions are READ Account.Access: Organizations, Identity Providers, and Groups; READ Zone.Zone; EDIT Zone.DNS
CloudFlare API token: [redacted]
Enter the domains for which you would like to automatically update the DNS records, delimited by a single comma.
Comma-delimited domains: side-a.example.com
```

Testing it out to ensure the A record can be updated:

```
$ cloudflare-ddns --update-now
Found external IPv4: "1.x.x.x"
Listing all zones.
Finding all DNS records.
Updating the A record (ID x) of (sub)domain side-a.example.com (ID x) to 1.x.x.x.
DNS record updated successfully!
```

We can run this command from above in a cron, but I will use a bash script to only run when the public ip changed: `/opt/scripts/detect_ip_change.sh`:

```
#!/bin/bash
set -ex
MY_DDNS_HOST="side-a.example.com"

if [ $(dig ${MY_DDNS_HOST} +short) == $(curl -s icanhazip.com) ];
  then exit 0;
  else /usr/local/bin/cloudflare-ddns --update-now;
fi
```

Make the file executable: `chmod +x /opt/scripts/detect_ip_change.sh` then edit your cronjobs: `crontab -e` and add the script:

```
* * * * * /opt/scripts/detect_ip_change.sh
```

This will keep your DNS updated, this needs to be done on both sides, if you want to use dynamic dns.

## Port Forwarding

We will need to forward UDP traffic from the router to the VPN server, on both sides:

```
Port: UDP/500 
Target: VPN-Server-IP:500

Port: UDP/4500
Target: VPN-Server-IP:4500
```

## Create a Pre-Shared Key

Create a preshared key that will be used on both sides to authenticate:

```
$ openssl rand -base64 36
pgDU4eKZaQNL7GNRWJPvZbaSYFn2PAFjK9vDOvxAQ85p7qc4
```

This value will be used on both sides, which we will need later.

## Install Strongswan on Side-A

Install strongswan and enable the service on boot:

```
$ apt install strongswan -y
$ systemctl enable strongswan
```

The left side will be the side we are configuring and the right side will be the remote side.

Create the config: `/etc/ipsec.conf` and provide the following config:

```
config setup
    charondebug="all"
    uniqueids=yes
    virtual_private=
    cachecrls=no

conn vpn-to-side-b
    type=tunnel
    authby=secret
    left=%defaultroute
    leftid=side-a.example.com
    leftsubnet=192.168.0.0/24
    right=%side-b.example.com
    rightid=side-b.example.com
    rightsubnet=192.168.1.0/24
    ike=aes256-sha2_256-modp1024!
    esp=aes256-sha2_256!
    keyingtries=0
    ikelifetime=1h
    lifetime=8h
    dpddelay=30
    dpdtimeout=120
    dpdaction=restart
    auto=start
```

Create the secrets file: `/etc/ipsec.secrets`:

```
side-b.example.com : PSK "pgDU4eKZaQNL7GNRWJPvZbaSYFn2PAFjK9vDOvxAQ85p7qc4"
```

Append the following kernel parameters to `/etc/sysctl.conf`:

```
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
```

Save:

```
$ sysctl -p
```

We now want to add a POSTROUTING and FORWARD rule using iptables:

```
$ iptables -t nat -A POSTROUTING -s 192.168.1.0/24  -d 192.168.0.0/24 -j MASQUERADE
$ iptables -A FORWARD -s 192.168.1.0/24 -d 192.168.0.0/24 -j ACCEPT
```

Now we need to route back:

```
$ ip route add 192.168.1.0/24 via 192.168.0.2 dev eth0
```

We want to persist the iptables and static route across reboots, so edit the `/etc/rc.local` file, if it's not there create it with the following values:

```
#!/bin/bash
iptables -t nat -A POSTROUTING -s 192.168.1.0/24  -d 192.168.0.0/24 -j MASQUERADE
iptables -A FORWARD -s 192.168.1.0/24 -d 192.168.0.0/24 -j ACCEPT
ip route add 192.168.1.0/24 via 192.168.0.2 dev eth0
exit 0
```

If you created the file, make sure to apply executable permissions:

```
$ chmod +x /etc/rc.local
```

Read the secrets and restart strongswan:

```
$ ipsec rereadsecrets
$ systemctl restart strongswan
```

## Install Strongswan on Side-B

Install strongswan and enable the service on boot:

```
$ apt install strongswan -y
$ systemctl enable strongswan
```

The left side will be the side we are configuring and the right side will be the remote side.

Create the config: `/etc/ipsec.conf` and provide the following config:

```
config setup
    charondebug="all"
    uniqueids=yes
    virtual_private=
    cachecrls=no

conn vpn-to-side-a
    type=tunnel
    authby=secret
    left=%defaultroute
    leftid=side-b.example.com
    leftsubnet=192.168.1.0/24
    right=%side-a.example.com
    rightid=side-a.example.com
    rightsubnet=192.168.0.0/24
    ike=aes256-sha2_256-modp1024!
    esp=aes256-sha2_256!
    keyingtries=0
    ikelifetime=1h
    lifetime=8h
    dpddelay=30
    dpdtimeout=120
    dpdaction=restart
    auto=start
```

Create the secrets file: `/etc/ipsec.secrets`:

```
side-a.example.com : PSK "pgDU4eKZaQNL7GNRWJPvZbaSYFn2PAFjK9vDOvxAQ85p7qc4"
```

Append the following kernel parameters to `/etc/sysctl.conf`:

```
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
```

Save:

```
$ sysctl -p
```

We now want to add a POSTROUTING and FORWARD rule using iptables:

```
$ iptables -t nat -A POSTROUTING -s 192.168.0.0/24  -d 192.168.1.0/24 -j MASQUERADE
$ iptables -A FORWARD -s 192.168.0.0/24 -d 192.168.1.0/24 -j ACCEPT
```

Now we need to route back:

```
$ ip route add 192.168.0.0/24 via 192.168.1.2 dev eth0
```

We want to persist the iptables and static route across reboots, so edit the `/etc/rc.local` file, if it's not there create it with the following values:

```
#!/bin/bash
iptables -t nat -A POSTROUTING -s 192.168.0.0/24  -d 192.168.1.0/24 -j MASQUERADE
iptables -A FORWARD -s 192.168.0.0/24 -d 192.168.1.0/24 -j ACCEPT
ip route add 192.168.0.0/24 via 192.168.1.2 dev eth0
exit 0
```

If you created the file, make sure to apply executable permissions:

```
$ chmod +x /etc/rc.local
```

Read the secrets and restart strongswan:

```
$ ipsec rereadsecrets
$ systemctl restart strongswan
```

## Verify Status

Verify that the ipsec tunnel is up on side-a:

```
$ ipsec statusall

Connections:
  vpn-to-side-b:  %any...side-b.example.com,0.0.0.0/0,::/0  IKEv1/2
  vpn-to-side-b:   local:  [side-a.example.com] uses pre-shared key authentication
  vpn-to-side-b:   remote: [side-b.example.com] uses pre-shared key authentication
  vpn-to-side-b:   child:  192.168.0.0/24 === 192.168.1.0/24 TUNNEL
Security Associations (1 up, 0 connecting):
  vpn-to-side-b[1]: ESTABLISHED 28 minutes ago, 192.168.0.2[side-a.example.com]...4x.x.x.214[side-b.example.com]
  vpn-to-side-b[1]: IKEv2 SPIs: 81996170df1c927d_i e8294946491ddf08_r, pre-shared key reauthentication in 2 hours
  vpn-to-side-b[1]: IKE proposal: AES_CBC_128/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/ECP_256
  vpn-to-side-b{2}:  INSTALLED, TUNNEL, reqid 1, ESP in UDP SPIs: cc4504be_i c294cb26_o
  vpn-to-side-b{2}:  AES_CBC_128/HMAC_SHA2_256_128, 0 bytes_i, 240 bytes_o (4 pkts, 7s ago), rekeying in 18 minutes
  vpn-to-side-b{2}:   192.168.0.0/24 === 192.168.1.0/24
```

Verify that the ipsec tunnel is up on side-b:

```
$ ipsec statusall

Connections:
 vpn-to-side-a:  %any...side-a.example.com,0.0.0.0/0,::/0  IKEv1/2
 vpn-to-side-a:   local:  [side-b.example.com] uses pre-shared key authentication
 vpn-to-side-a:   remote: [side-a.example.com] uses pre-shared key authentication
 vpn-to-side-a:   child:  192.168.1.0/24 === 192.168.0.0/24 TUNNEL
Security Associations (1 up, 0 connecting):
 vpn-to-side-a[2]: ESTABLISHED 20 minutes ago, 192.168.1.2[side-b.example.com]...14x.x.x.x[side-a.example.com]
 vpn-to-side-a[2]: IKEv2 SPIs: 81996170df1c927d_i e8294946491ddf08_r, pre-shared key reauthentication in 2 hours
 vpn-to-side-a[2]: IKE proposal: AES_CBC_128/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/ECP_256
 vpn-to-side-a{2}:  INSTALLED, TUNNEL, reqid 1, ESP in UDP SPIs: c294cb26_i cc4504be_o
 vpn-to-side-a{2}:  AES_CBC_128/HMAC_SHA2_256_128, 0 bytes_i, 0 bytes_o, rekeying in 26 minutes
 vpn-to-side-a{2}:   192.168.1.0/24 === 192.168.0.0/24
```

From side-a (192.168.0.2) ping the gateway on side-b (192.168.1.1):

```
$ $ ping -c2 192.168.1.1
PING 10.3.96.2 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=62 time=11.9 ms
```

If you want to be able to reach the private range of the other side of the vpn from any device on your network, you should add a static route on your router to inform your default gateway where to route traffic to. 

In this case on side-a (192.168.0.0/24) we want to inform our default gateway to route (192.168.1.0/24) to the VPN as it knows to route that destination over the VPN.

On side-a, on your router, add a static route:

```
Route: 192.168.1.0
Subnet: 255.255.255.0
Gateway: 192.168.0.2
```

On side-b, on your router, add a static route:

```
Route: 192.168.0.0
Subnet: 255.255.255.0
Gateway: 192.168.1.2
```

## Optional: Roadwarrior VPN Clients

This step is optional, but since we can access each others homelabs, we thought it would be nice to be able to access the resources from mobile devices or laptops when we are on remote locations.

We made it that each VPN owner will connect to its own endpoint (for roadwarriors), so side-a (which will be me) will connect to its own dns endpoint to connect when away from home..

I will only demonstrate how to append your config to add the ability for a roadwarrion vpn connection, append to the `/etc/ipsec.conf`:

```
# ...
conn ikev2-vpn
    auto=add
    type=tunnel
    authby=secret
    left=%any
    leftid=side-a.roadwarrior
    leftsubnet=0.0.0.0/0
    right=%any
    rightid=%any
    rightsourceip=10.10.0.0/24
    rightdns=192.168.0.1,8.8.8.8
    auto=start
```

Append the secret in `/etc/ipsec.secrets`:

```
# ...
side-a.roadwarrior my-laptop : PSK "MySuperSecureSecret123"
```

Add the vpn ip's that we will assign to the roardwarrior clients to the routing table:

```
$ ip route add 10.10.0.0/24 via 192.168.0.2 dev eth0
```

If you only want the roadwarriors to be able to reach your network, you will only forward to the local network such as:

```
$ iptables -A FORWARD -s 10.10.0.0/24 -d 192.168.0.0/24 -j ACCEPT
```

But we will be forwarding traffic to all destinations:

```
$ iptables -A FORWARD -s 10.10.0.0/24 -d 0.0.0.0/0 -j ACCEPT
$ iptables -t nat -A POSTROUTING -s 10.10.0.0/24 -d 0.0.0.0/0 -j MASQUERADE
```

Remember to append the routes to `/etc/rc.local` to persist across reboots.

Reread the secrets and restart strongswan:

```
$ ipsec rereadsecrets
$ systemctl restart strongswan
```

Connecting your VPN Client, I will be using my Laptop, with the following details:

```
VPN Type: IKEv2
Description: Home VPN
Server: side-a.example.com
Remote ID: side-a.roadwarrior
Local ID: my-laptop
User Authentication: None
Secret: MySuperSecureSecret123
```

## Thank You

In this tutorial I demonstrated how to setup a site to site ipsec vpn between 2 sides that consists of internet connections that has dynamic ip's and also appending roadwarrior config so that you can connect to your homelab from anywhere in the world.
