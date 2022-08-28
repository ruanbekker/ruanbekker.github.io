---
layout: post
title: "Easy Ad-Hoc VPNs with sshuttle"
date: 2020-10-26 06:59:44 +0000
comments: true
categories: ["vpn", "networking", "sshuttle"] 
---

Theres a utility called `sshuttle` which allows you to VPN via a SSH connection, which is really handy when you quickly want to be able to reach a private range, which is accessible from a public reachable server such as a bastion host.

In this tutorial, I will demonstrate how to install sshuttle on a mac, if you are using a different OS you can see their [documentation](https://github.com/sshuttle/sshuttle) and then we will use the VPN connection to reach a "prod" and a "dev" environment.

## SSH Config

We will declare 2 jump-boxes / bastion hosts in our ssh config:

  - `dev-jump-host` is a public server that has network access to our private endpoints in `172.31.0.0/16`
  - `prod-jump-host` is a public server that has network access to our private endpoints in `172.31.0.0/16`

In this case, the above example is 2 AWS Accounts with the same CIDR's, and wanted to demonstrate using sshuttle for this reason, as if we had different CIDRs we can setup a dedicated VPN and route them respectively.

```
$ cat ~/.ssh/config
Host *
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 30

Host dev-jump-host
    HostName dev-bastion.mydomain.com
    User bastion
    IdentityFile ~/.ssh/id_rsa

Host prod-jump-host
    HostName prod-bastion.mydomain.com
    User bastion
    IdentityFile ~/.ssh/id_rsa
```

## Install sshuttle

Install sshuttle for your operating system:

```
# macos
$ brew install shuttle

# debian
$ apt install sshuttle
```

## Usage

To setup a vpn tunnel to route connections to our prod account:

```
$ sshuttle -r prod-jump-host 172.31.0.0/16
```

Or to setup a vpn tunnel to route connections to our dev account:

```
$ sshuttle -r dev-jump-host 172.31.0.0/16
```

Once one of your chosen sessions establishes, you can use a new terminal to access your private network, as example:

```
$ nc -vz 172.31.23.40 22
```

## Bash Functions

We can wrap this into functions, so we can use `vpn_dev` or `vpn_prod` which aliases to the commands shown below:

```
$ cat ~/.functions
vpn_prod(){
  sshuttle -r prod-jump-host 172.31.0.0/16
}

vpn_dev(){
  sshuttle -r dev-jump-host 172.31.0.0/16
}
```

Now source that to your environment:

```
$ source ~/.functions
```

Then you should be able to use `vpn_dev` and `vpn_prod` from your terminal:

```
$ vpn_prod
[local sudo] Password:
Warning: Permanently added 'xx,xx' (ECDSA) to the list of known hosts.
client: Connected.
```

And in a new terminal we can connect to a RDS MySQL Database sitting in a private network:

```
$ mysql -h my-prod-db.pvt.mydomain.com -u dbadmin -p$pass
mysql>
```

## Sshuttle as a Service

You can create a systemd unit file to run a sshuttle vpn as a service. In this scenario I provided 2 different vpn routes, dev and prod, so you can create 2 seperate systemd unit files, but my case I will only create for prod:

```
$ cat /etc/systemd/system/vpn_prod.service
[Unit]
Description=ShuttleProdVPN
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=500
StartLimitBurst=5

[Service]
User=root
Group=root
Type=simple
Restart=on-failure
RestartSec=10s
ExecStart=/usr/bin/sshuttle -r prod-jump-host 172.31.0.0/16

[Install]
WantedBy=multi-user.target
```

Reload the systemd daemon:

```
$ sudo systemctl daemon-reload
```

Enable and start the service:

```
$ sudo systemctl enable vpn_prod
$ sudo systemctl start vpn_prod
```

## Thank You

Thanks for reading.
