---
layout: post
title: "Setup a PPTP VPN on Ubuntu"
date: 2018-06-27 04:18:51 -0400
comments: true
categories: ["networking", "vpn"] 
---

In this post we will setup a [PPTP](https://en.wikipedia.org/wiki/Point-to-Point_Tunneling_Protocol) VPN on Ubuntu 16.04

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Disable IPv6 Networking:

Edit the grub config:

```bash
$ vi /etc/default/grub
```

Make the following changes:

```
GRUB_CMDLINE_LINUX_DEFAULT="ipv6.disable=1"
GRUB_CMDLINE_LINUX="ipv6.disable=1"
```

Update Grub and Reboot:

```bash
$ update-grub
$ reboot
```

## Updates and Install PPTP:

Update Repositories and install PPTPD:

```bash
$ apt update && apt upgrade -y
$ apt install pptpd -y
```

Configure your Authentication

```bash
$ vi /etc/ppp/chap-secrets
```

```
# client	server 	secret 			IP addresses
youruser   	pptpd   yourpass		*
```

Configure Local and Remote IP, in this case I want 10.1.1.2 to 10.1.5.1-254

```bash
$ vi /etc/pptpd.conf
```

```
option /etc/ppp/pptpd-options
logwtmp
connections 10000
localip 10.1.1.1
remoteip 10.1.1.2-254,10.1.2.1-254,10.1.3.2-254,10.1.4.1-254,10.1.5.1-254
# for a /24 you can set
# remoteip 10.1.1.2-254
```

## Enable IP Forwarding:

Edit the sysctl.conf and enable IP Forwarding:

```bash
$ vim /etc/sysctl.conf
```

Populate the following value:

```
net.ipv4.ip_forward=1
```

Update the Changes:

```bash
$ sysctl -p
```

## Enable and Start PPTPD:

Enable the service on boot and start the service:

```bash
$ systemctl enable pptpd
$ systemctl start pptpd
$ systemctl status pptpd
```

Connect to your VPN.

## Resources:
- https://www.vultr.com/docs/setup-a-pptp-vpn-server-on-ubuntu
- https://github.com/viljoviitanen/setup-simple-pptp-vpn
