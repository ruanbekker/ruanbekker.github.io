---
layout: post
title: "Wireguard VPN with Unbound ADS Blocking DNS"
date: 2021-03-10 00:59:51 -0500
comments: true
categories: ["linux", "vpn", "wireguard", "privacy", "dns", "unbound"]
---

In this tutorial we will setup a Wireguard VPN with Unbound DNS Server with some additional configuration to block ads for any clients using the DNS Server while connected to the VPN.

A massive thank you to [complexorganizations](https://github.com/complexorganizations/wireguard-manager/blob/main/wireguard-server.sh) for providing the source where this tuturial is based off.

## Install Packages

I will be using Debian Buster for this installation:

```
$ apt update
$ apt upgrade -y
$ apt update && apt install iptables curl coreutils bc jq sed e2fsprogs -y
$ apt install linux-headers-"$(uname -r)" -y
```

I want to disable IPv6, in my case I had to apply a couple of kernel parameter tweaks:

```
$ echo net.ipv6.conf.all.disable_ipv6 = 1 > /etc/sysctl.d/70-disable-ipv6.conf
$ echo "net.ipv6.conf.$(ip -4 route ls | grep default | grep -Po '(?<=dev )(\S+)' | head -1).disable_ipv6 = 1" >> /etc/sysctl.d/70-disable-ipv6.conf
$ echo 'net.ipv4.ip_forward = 1' > /etc/sysctl.d/60-enable-ip-forwarding.conf
$ sysctl -p -f /etc/sysctl.d/70-disable-ipv6.conf
$ sysctl -p -f /etc/sysctl.d/60-enable-ip-forwarding.conf
```

## Environment Variables

A couple of environment variables that we will reference during our installation, tweak where your setup differs:

```
$ export NPROC=$(nproc)
$ export SERVER_HOST=$(curl -s -4 ifconfig.co)
$ export SERVER_PORT="51820"
$ export MTU_CHOICE="1280"
$ export NAT_CHOICE="25"
$ export IPV4_SUBNET="10.7.0.0/24"
$ export PRIVATE_SUBNET_V4=${IPV4_SUBNET}
$ export GATEWAY_ADDRESS_V4="${PRIVATE_SUBNET_V4::-4}1"
$ export PRIVATE_SUBNET_MASK_V4=$(echo "$PRIVATE_SUBNET_V4" | cut -d "/" -f 2)
$ export CLIENT_DNS="$GATEWAY_ADDRESS_V4"
$ export CLIENT_ALLOWED_IP="0.0.0.0/0"
```

## Unbound Installation

Download the unbound `root.hints` file from internic:

```
$ curl https://www.internic.net/domain/named.cache --create-dirs -o /etc/unbound/root.hints
```

Generate the `/etc/unbound/unbound.conf` config:

```
$ echo "include: \"/etc/unbound/unbound.conf.d/*.conf\"
server:
    num-threads: $NPROC
    verbosity: 1
    root-hints: /etc/unbound/root.hints
    # auto-trust-anchor-file: /var/lib/unbound/root.key
    interface: 0.0.0.0
    interface: ::0
    max-udp-size: 3072
    access-control: 0.0.0.0/0                 refuse
    access-control: $PRIVATE_SUBNET_V4               allow
    access-control: 127.0.0.1                 allow
    private-address: $PRIVATE_SUBNET_V4
    hide-identity: yes
    hide-version: yes
    harden-glue: yes
    harden-dnssec-stripped: yes
    harden-referral-path: yes
    unwanted-reply-threshold: 10000000
    val-log-level: 1
    cache-min-ttl: 1800
    cache-max-ttl: 14400
    prefetch: yes
    qname-minimisation: yes
    prefetch-key: yes
    forward-zone:
        name: \".\"
        forward-addr: 1.1.1.1
        forward-addr: 8.8.8.8" >> /etc/unbound/unbound.conf
```

Download the host entries for all the ad servers which we will block:

```
$ curl https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/social/hosts -o /tmp/adblocking_hosts
```

Include the ads configuration in `/etc/unbound/unbound.d/ads.conf`:

```
$ echo "server:" > /etc/unbound/unbound.conf.d/ads.conf
$ cat /etc/unbound/adblocking_hosts | grep '^0\.0\.0\.0' | awk '{print "    local-zone: \""$2"\" redirect\n    local-data: \""$2" A 0.0.0.0\""}' >> /etc/unbound/unbound.conf.d/ads.conf
```

Update the VPN Server's nameserver configuration to unbound:

```
$ chattr -i /etc/resolv.conf
$ mv /etc/resolv.conf /etc/resolv.conf.old
$ echo "nameserver 127.0.0.1" >>/etc/resolv.conf
$ chattr +i /etc/resolv.conf
```

Enable and Restart Unbound:

```
$ systemctl enable unbound
$ systemctl restart unbound
```

Test if DNS Resolution works:

```
$ dig google.com
```

## Wireguard Installation 

Include the sources and install wireguard and its dependencies:

```
$ echo "deb http://deb.debian.org/debian/ unstable main" >>/etc/apt/sources.list.d/unstable.list
$ echo -e "Package: *\nPin: release a=unstable\nPin-Priority: 90"  >>/etc/apt/preferences.d/limit-unstable
$ apt update
$ apt install wireguard qrencode haveged ifupdown -y
```

Set the environment variables and tweak where you need to:

```
$ export SERVER_PRIVKEY=$(wg genkey)
$ export SERVER_PUBKEY=$(echo "$SERVER_PRIVKEY" | wg pubkey)
$ export CLIENT_NAME="ruan-pc"
$ export CLIENT_PRIVKEY=$(wg genkey)
$ export CLIENT_PUBKEY=$(echo "$CLIENT_PRIVKEY" | wg pubkey)
$ export CLIENT_ADDRESS_V4="${PRIVATE_SUBNET_V4::-4}3"
$ export PRESHARED_KEY=$(wg genpsk)
$ export WIREGUARD_PUB_NIC="wg0"
$ export PEER_PORT=$(shuf -i1024-65535 -n1)
$ export WG_CONFIG="/etc/wireguard/$WIREGUARD_PUB_NIC.conf"
```

Create the wireguard clients directory and create the config filename:

```
$ mkdir -p /etc/wireguard/clients
$ touch $WG_CONFIG && chmod 600 $WG_CONFIG
```

Create the wireguard server config content and write it to the config file:

```
$ echo "# $PRIVATE_SUBNET_V4 $SERVER_HOST:$SERVER_PORT $SERVER_PUBKEY $CLIENT_DNS $MTU_CHOICE $NAT_CHOICE $CLIENT_ALLOWED_IP
[Interface]
Address = $GATEWAY_ADDRESS_V4/$PRIVATE_SUBNET_MASK_V4
ListenPort = $SERVER_PORT
PrivateKey = $SERVER_PRIVKEY
PostUp = iptables -A FORWARD -i $WIREGUARD_PUB_NIC -o $SERVER_PUB_NIC -j ACCEPT; iptables -t nat -A POSTROUTING -o $SERVER_PUB_NIC -j MASQUERADE; iptables -A INPUT -s $PRIVATE_SUBNET_V4 -p udp -m udp --dport 53 -m conntrack --ctstate NEW -j ACCEPT
PostDown = iptables -D FORWARD -i $WIREGUARD_PUB_NIC  -o $SERVER_PUB_NIC -j ACCEPT; iptables -t nat -D POSTROUTING -o $SERVER_PUB_NIC -j MASQUERADE; iptables -D INPUT -s $PRIVATE_SUBNET_V4 -p udp -m udp --dport 53 -m conntrack --ctstate NEW -j ACCEPT
SaveConfig = false
# $CLIENT_NAME start
[Peer]
PublicKey = $CLIENT_PUBKEY
PresharedKey = $PRESHARED_KEY
AllowedIPs = $CLIENT_ADDRESS_V4/32
# $CLIENT_NAME end >>" >> $WG_CONFIG
```

Create the client config:

```
$ echo "# $CLIENT_NAME
[Interface]
Address = $CLIENT_ADDRESS_V4/$PRIVATE_SUBNET_MASK_V4
DNS = $CLIENT_DNS
ListenPort = $PEER_PORT
MTU = $MTU_CHOICE
PrivateKey = $CLIENT_PRIVKEY
[Peer]
AllowedIPs = $CLIENT_ALLOWED_IP
Endpoint = $SERVER_HOST:$SERVER_PORT
PersistentKeepalive = $NAT_CHOICE
PresharedKey = $PRESHARED_KEY
PublicKey = $SERVER_PUBKEY" >> /etc/wireguard/clients/"$CLIENT_NAME"-$WIREGUARD_PUB_NIC.conf
```

Restart and Enable Wireguard:

```
$ systemctl enable wg-quick@$WIREGUARD_PUB_NIC
$ systemctl restart wg-quick@$WIREGUARD_PUB_NIC
```

## Connect your Client

Head over to [Wireguard.com](https://www.wireguard.com/install/) and install the client of your choice then generate a QR Code:

```
$ qrencode -t ansiutf8 -l L </etc/wireguard/clients/"$CLIENT_NAME"-$WIREGUARD_PUB_NIC.conf
```

Configure your client and connect to the VPN, after the connection has been established you can have a look on the server for connection details with:

```
$ wg show
```

Once connected head over to a website with ads, such as https://www.speedtest.net/ and you should see no ads.

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
