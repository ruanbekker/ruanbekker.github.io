---
layout: post
title: "Sysadmin Linux Troubleshooting Cheatsheet"
date: 2019-02-10 14:17:54 -0500
comments: true
categories: ["linux", "sysadmin", "cheatsheet", "troubleshooting"] 
---

This is a one pager of all the commands I use when I have to troubleshoot problems. This post will be updated as time goes by.

## Curl / Web Response Times

Template file:

```bash
$ cat curl-format.txt
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
----------\n
time_total:  %{time_total}\n
```

The host header, source addres, destination address:

```bash
$ curl -sk -w "@curl-format.txt" -o /dev/null -H "Host: remote-host.mydomain.com" 10.0.2.10 https://10.244.0.240:443 -L

time_namelookup:  0.012178
time_connect:  0.012225
time_appconnect:  0.062149
time_pretransfer:  0.062175
time_redirect:  0.000172
time_starttransfer:  0.125631
----------
time_total:  0.125849
```

## MTR / Network Latencies / Packetloss

No dns, TCP, counts, port, source address, destination address:

```bash
$ mtr -n -T -c 10 --port 443 10.2.0.2 10.244.10.5 --report
Start: Sun Feb 10 19:04:50 2019
HOST: my-internet-gatewewy         Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 172.18.110.22              0.0%    10    0.3   0.3   0.3   0.3   0.0
  2.|-- 172.18.110.22              0.0%    10    0.3   0.3   0.3   0.3   0.0
  3.|-- 172.18.110.22              0.0%    10    0.3   0.3   0.3   0.3   0.0
```

## TCPTraceroute

No dns, TCP, port, source address, destination address:

```bash
$ traceroute -T -n -p 443 -s 10.80.4.7 10.2.129.4; done
traceroute to 10.2.129.4 (10.2.129.4), 30 hops max, 60 byte packets
 1  10.80.4.1   0.322 ms  0.291 ms  0.224 ms
 2  10.2.129.4  179.090 ms  179.022 ms  179.023 ms
```

## Connection Related:

Connection flow: [Thanks to](https://askubuntu.com/questions/538443/whats-the-difference-between-port-status-listening-time-wait-close-wait)

```
Consider two programs attempting a socket connection (call them a and b). Both set up sockets and transition to the LISTEN state. Then one program (say a) tries to connect to the other (b). a sends a request and enters the SYN_SENT state, and b receives the request and enters the SYN_RECV state. When b acknowledges the request, they enter the ESTABLISHED state, and do their business. Now a couple of things can happen:

    a wishes to close the connection, and enters FIN_WAIT1. b receives the FIN request, sends an ACK (then a enters FIN_WAIT2), enters CLOSE_WAIT, tells a it is closing down and the enters LAST_ACK. Once a acknowledges this (and enters TIME_WAIT), b enters CLOSE. a waits a bit to see if anythings is left, then enters CLOSE.
    a and b have finished their business and decide to close the connection (simultaneous closing). When a is in FIN_WAIT, and instead of receiving an ACK from b, it receives a FIN (as b wishes to close it as well), a enters CLOSING. But there are still some messages to send (the ACK that a is supposed to get for its original FIN), and once this ACK arrives, a enters TIME_WAIT as usual.
```

Active Connections:

```
$ netstat -n -A  inet | grep -v "127.0.0.1"
```

Established Connections:

```
$ netstat -nputw | grep ESTABLISHED
$ netstat -antp | grep :3306 | grep ESTABLISHED
```

Time Wait Connections:

```
$ netstat -antp | grep TIME_WAIT
```

How many connections:

```
$ wc -l /proc/net/tcp
```

Listing Open files per Port:

```
$ lsof -i:3306
```

Listing Open files per User:

```
$ lsof -u glassfish
```

## Resources

- [AWS: Troubleshoot VPN Latencies](https://aws.amazon.com/premiumsupport/knowledge-center/troubleshoot-vpn-packet-loss/)
- [Linode: Diagnose Network Issues with MTR](https://www.linode.com/docs/networking/diagnostics/diagnosing-network-issues-with-mtr/)
