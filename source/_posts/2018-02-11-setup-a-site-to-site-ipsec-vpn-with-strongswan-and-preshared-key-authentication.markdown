---
layout: post
title: "Setup a Site to Site IPsec VPN with Strongswan and PreShared Key Authentication"
date: 2018-02-11 16:09:37 -0500
comments: true
categories: ["strongswan", "vpn", "ipsec", "networking", "ubuntu"] 
---

![](https://i.snag.gy/sWn8zc.jpg)

Today we will setup a Site to Site ipsec VPN with Strongswan, which will be configured with PreShared Key Authentication.

After our tunnels are established, we will be able to reach the private ips over the vpn tunnels.

## Get the Dependencies:

Update your repository indexes and install strongswan:

```bash
$ apt update && sudo apt upgrade -y
$ apt install strongswan -y
```

Set the following kernel parameters:

```bash
$ cat >> /etc/sysctl.conf << EOF
echo net.ipv4.ip_forward = 1 
net.ipv4.conf.all.accept_redirects = 0 
net.ipv4.conf.all.send_redirects = 0
EOF

$ sysctl -p /etc/sysctl.conf
```

## Generate Preshared Key:

We will need a preshared key that both servers will use:

```
$ openssl rand -base64 64
87zRQqylaoeF5I8o4lRhwvmUzf+pYdDpsCOlesIeFA/2xrtxKXJTbCPZgqplnXgPX5uprL+aRgxD8ua7MmdWaQ
```

## Details of our 2 Sites:

Site A:

```bash
Location: Paris, France
External IP: 51.15.139.201
Internal IP: 10.10.27.1/24
```

Site B:

```bash
Location: Amsterdam, Netherlands
External IP: 51.15.44.48
Internal IP: 10.9.141.1/24
```

## Configure Site A:

We will setup our VPN Gateway in Site A (Paris), first to setup the `/etc/ipsec.secrets` file:

```bash
$ cat /etc/ipsec.secrets
# source      destination
51.15.139.201 51.15.44.48 : PSK "87zRQqylaoeF5I8o4lRhwvmUzf+pYdDpsCOlesIeFA/2xrtxKXJTbCPZgqplnXgPX5uprL+aRgxD8ua7MmdWaQ"
```

Now to setup our VPN configuration in `/etc/ipsec.conf`:

```
cat /etc/ipsec.conf
# basic configuration
config setup
        charondebug="all"
        uniqueids=yes
        strictcrlpolicy=no

# connection to amsterdam datacenter
conn paris-to-amsterdam
	authby=secret
	left=%defaultroute
	leftid=51.15.139.201
	leftsubnet=10.10.27.1/24
	right=51.15.44.48
	rightsubnet=10.9.141.1/24
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

Firewall Rules:

```bash
$ sudo iptables -t nat -A POSTROUTING -s 10.9.141.0/24 -d 10.10.27.0/24 -j MASQUERADE
```

## Configure Site B:

We will setup our VPN Gateway in Site B (Amsterdam), setup the `/etc/ipsec.secrets` file:

```bash
$ cat /etc/ipsec.secrets
51.15.44.48 51.15.139.201 : PSK "87zRQqylaoeF5I8o4lRhwvmUzf+pYdDpsCOlesIeFA/2xrtxKXJTbCPZgqplnXgPX5uprL+aRgxD8ua7MmdWaQ"
```

Next to setup our VPN Configuration:

```
cat /etc/ipsec.conf
# basic configuration
config setup
        charondebug="all"
        uniqueids=yes
        strictcrlpolicy=no

# connection to paris datacenter
conn amsterdam-to-paris
	authby=secret
	left=%defaultroute
 	leftid=51.15.44.48
 	leftsubnet=10.9.141.1/24
 	right=51.15.139.201
 	rightsubnet=10.10.27.1/24
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

Firewall Rules:

```bash
$ sudo iptables -t nat -A POSTROUTING -s 10.10.27.0/24 -d 10.9.41.0/24 -J MASQUERADE
```

## Start the VPN:

Start the VPN on both ends:

```bash
$ sudo ipsec restart
```

Get the status of the tunnel, in this case we are logged onto our Site A (Paris) Server:

```
$ sudo ipsec status
Security Associations (1 up, 0 connecting):
paris-to-amsterdam[2]: ESTABLISHED 14 minutes ago, 10.10.27.161[51.15.139.201]...51.15.44.48[51.15.44.48]
paris-to-amsterdam{1}:  INSTALLED, TUNNEL, reqid 1, ESP in UDP SPIs: c8c868ee_i c9d58dbd_o
paris-to-amsterdam{1}:   10.10.27.1/24 === 10.9.141.1/24
```

Test if we can see the remote end on its private range:

```bash
$ ping 10.9.141.97
PING 10.9.141.97 (10.9.141.97) 56(84) bytes of data.
64 bytes from 10.9.141.97: icmp_seq=1 ttl=64 time=14.6 ms
```

Set the service to start on boot:

```bash
$ sudo systemctl enable strongswan
```

Then your VPN should be setup correctly.

## Other useful commands:

Start / Stop / Status:

```bash
$ sudo ipsec up connection-name
$ sudo ipsec down connection-name

$ sudo ipsec restart
$ sudo ipsec status
$ sudo ipsec statusall
```

Get the Policies and States of the IPsec Tunnel:

```bash
$ sudo ip xfrm state
$ sudo ip xfrm policy
```

Reload the secrets, while the service is running:

```bash
$ sudo ipsec rereadsecrets
```

Check if traffic flows through the tunnel:

```bash
$ sudo tcpdump esp
```

## Adding more connections to your config:

If you have to add another site to your config, the example of the `ipsec.secrets` will look like:

```bash
$ cat /etc/ipsec.secrets
51.15.139.201 51.15.44.48 : PSK "87zRQqylaoeF5I8o4lRhwvmUzf+pYdDpsCOlesIeFA/2xrtxKXJTbCPZgqplnXgPX5uprL+aRgxD8ua7MmdWaQ"
51.15.139.201 51.15.87.41  : PSK "87zRQqylaoeF5I8o4lRhwvmUzf+pYdDpsCOlesIeFA/2xrtxKXJTbCPZgqplnXgPX5uprL+aRgxD8ua7MmdWaQ"
```

And the `ipsec.conf`:

```bash
cat /etc/ipsec.conf
# basic configuration
config setup
        charondebug="all"
        uniqueids=yes
        strictcrlpolicy=no

# connection to amsterdam datacenter
conn paris-to-amsterdam
	authby=secret
	left=%defaultroute
	leftid=51.15.139.201
	leftsubnet=10.10.27.161/32
	right=51.15.44.48
	rightsubnet=10.9.141.97/32
	ike=aes256-sha2_256-modp1024!
	esp=aes256-sha2_256!
	keyingtries=0
	ikelifetime=1h
	lifetime=8h
	dpddelay=30
	dpdtimeout=120
	dpdaction=restart
	auto=start

# connection to frankfurt datacenter
conn paris-to-frankfurt
	authby=secret
	left=%defaultroute
	leftid=51.15.139.201
	leftsubnet=10.10.27.1/24
	right=51.15.87.41
	rightsubnet=10.9.137.1/24
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

Just remember to configure the config on the Frankfurt VPN Gateway, and the example of the status output will look like the following:

```bash
$ sudo ipsec status
Security Associations (2 up, 0 connecting):
paris-to-frankfurt[2]: ESTABLISHED 102 seconds ago, 10.10.27.161[51.15.139.201]...51.15.87.41[51.15.87.41]
paris-to-frankfurt{1}:  INSTALLED, TUNNEL, reqid 2, ESP in UDP SPIs: cbc62a1f_i c95b8f78_o
paris-to-frankfurt{1}:   10.10.27.1/24 === 10.9.137.1/24
paris-to-amsterdam[1]: ESTABLISHED 102 seconds ago, 10.10.27.161[51.15.139.201]...51.15.44.48[51.15.44.48]
paris-to-amsterdam{2}:  INSTALLED, TUNNEL, reqid 1, ESP in UDP SPIs: c7b36756_i cc54053c_o
paris-to-amsterdam{2}:   10.10.27.1/24 === 10.9.141.1/24
```

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>
