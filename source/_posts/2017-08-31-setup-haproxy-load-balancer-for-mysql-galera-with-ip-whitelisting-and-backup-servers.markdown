---
layout: post
title: "Setup HAProxy Load Balancer for MySQL Galera with IP Whitelisting and Backup Servers"
date: 2017-08-31 19:15:50 -0400
comments: true
categories: ["mysql", "haproxy", "loadbalancer", "security"]
---

Today we will setup a HAProxy Service for our 3 Node MySQL Galera Cluster

## Our Setup:

- 3 Node Galera MySQL Cluster
- 3 HAProxy Services (Each HAProxy Service Running on the MySQL Nodes)
- MySQL Listens on Port 3307
- HAProxy Listens on Port 3306 and Proxies through to 3307

I have setup HAProxy on the same node as the MySQL Servers for my use case, but you can also setup HAProxy on a node outside the MySQL Host.

So essentially our MySQL Galera Cluster is a Multi Master Setup, but for now we will only accept connections from Node-A, and have Node-B and Node-C as Backup servers. Should Node-A go down, HAProxy will route connections to Node-B, and if Node-B also goes down, connections will be routed to Node-C.

If the Primary Node, which is Node-A recovers, connections will be restored to Node-A.

## Security:

We use iptables to allow traffic between the nodes for port TCP/3307 and allow all traffic for Port TCP/3306, as HAProxy will allow the IP Based Access:

```bash Iptables for Each Node
$ iptables -I INPUT -s {Node-A} -p tcp --dport 3307 -j ACCEPT
$ iptables -I INPUT -s {Node-B} -p tcp --dport 3307 -j ACCEPT
$ iptables -I INPUT -s {Node-C} -p tcp --dport 3307 -j ACCEPT
$ iptables -A INPUT -p tcp --dport 3306 -j ACCEPT
$ iptables -A INPUT -p tcp --dport 3307 -j DROP
```

## HAProxy:

Installing HAProxy on Ubuntu:

```bash Install HAProxy
$ sudo apt update 
$ sudo apt install haproxy -y
```

Configure HAProxy with a Port 3306 listener, specify your source addresses that you would like to be authorized to communicate with MySQL and then specify the servers to proxy the connections to our MySQL Galera Cluster, specifying 2 backup servers: 

```bash /etc/haproxy/haproxy.cfg
global
  log         127.0.0.1 local2
  chroot      /var/lib/haproxy
  pidfile     /var/run/haproxy.pid
  maxconn     1020
  user        haproxy
  group       haproxy
  daemon

  stats socket /var/lib/haproxy/stats.sock mode 600 level admin
  stats timeout 2m

defaults
  mode    tcp
  log     global
  option  dontlognull
  option  redispatch
  retries                   3
  timeout queue             45s
  timeout connect           5s
  timeout client            1m
  timeout server            1m
  timeout check             10s
  maxconn                   1020

listen stats
  bind    *:80
  mode    http
  stats   enable
  stats   show-legends
  stats   refresh           5s
  stats   uri               /
  stats   realm             Haproxy\ Statistics
  stats   auth              admin:secret
  stats   admin             if TRUE

listen galera-lb
  bind    *:3306
  mode    tcp
  acl     network_allowed src 10.10.1.0/24 10.32.15.2/32
  tcp-request               content accept if network_allowed
  tcp-request               content reject
  default_backend           galera-cluster

backend galera-cluster
  balance roundrobin
  server  scw-mysql-1 10.0.0.2:3307  check
  server  scw-mysql-2 10.0.0.3:3307  check backup
  server  scw-mysql-3 10.0.0.4:3307  check backup
```

Start HAProxy:

```bash Start HAProxy Service
$ sudo systemctl enable haproxy
$ sudo systemctl restart haproxy
```

## Authorize HAProxy Hostnames to Connect to MySQL:

In this case we need to allow the Hostnames to be able to connect to mysql:

```sql
mysql> GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'secrets' WITH GRANT OPTION;
mysql> FLUSH PRIVILEGES;
```

## Resources:

- https://raymii.org/s/snippets/haproxy_restrict_specific_urls_to_specific_ip_addresses.html

<center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>

