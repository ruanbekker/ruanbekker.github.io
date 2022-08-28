---
layout: post
title: "Capturing 54 Million Passwords with a Docker SSH Honeypot"
date: 2018-10-11 16:38:52 -0400
comments: true
categories: ["docker", "security", "honeypot", "ssh"]
---

![](https://res.cloudinary.com/rbekker/image/upload/v1539291851/ssh-docker-honeypot_eyhzc7.png)

The last couple of days I picked up on my ELK Stack a couple thousands of SSH Brute Force Attacks, so I decided I will just revisit my SSH Server configuration, and change my SSH Port to something else for the interim. The dashboard that showed me the results at that point in time:

![](https://res.cloudinary.com/rbekker/image/upload/v1539292443/kibana-failed-ssh-auth_udkxkl.png)

Then I decided I actually would like to setup a SSH Honeypot to listen on Port 22 and change my SSH Server to listen on 222 and capture their IP Addresses, Usernames and Passwords that they are trying to use and dump it all in a file so that I can build up my own password dictionary :D

## SSH Configuration:

Changing the SSH Port:

```bash
$ sudo vim /etc/ssh/sshd_config
```

Change the port to 222:

```bash
Port 222
```

Restart the SSH Server:

```bash
$ sudo /etc/init.d/ssh restart
```

Verify that the SSH Server is running on the new port:

```bash
$ sudo netstat -tulpn | grep sshd
tcp        0      0 0.0.0.0:222            0.0.0.0:*               LISTEN      28838/sshd
```

## Docker SSH Honeypot:

Thanks to [random-robbie](https://github.com/random-robbie/docker-ssh-honey), as he had everything I was looking for on Github.

Setup the SSH Honeypot:

```bash
$ git clone https://github.com/random-robbie/docker-ssh-honey
$ cd docker-ssh-honey/
$ docker build . -t local:ssh-honepot
$ docker run -itd --name ssh-honeypot -p 22:22 local:ssh-honepot
```

Once people attempt to ssh, you will get the output to stdout:

```bash
$ docker logs -f $(docker ps -f name=ssh-honeypot -q) | grep -v 'Error exchanging' | head -10
[Tue Jul 31 01:13:41 2018] ssh-honeypot 0.0.8 by Daniel Roberson started on port 22. PID 5
[Tue Jul 31 01:19:49 2018] 1xx.1xx.1xx.1x gambaa gambaa
[Tue Jul 31 01:23:26 2018] 1xx.9x.1xx.1xx root toor
[Tue Jul 31 01:25:57 2018] 1xx.2xx.1xx.1xx root Passw0rd1234
[Tue Jul 31 01:26:00 2018] 1xx.2xx.1xx.1xx root Qwer1234
[Tue Jul 31 01:26:00 2018] 1xx.2xx.1xx.1xx root Abcd1234
[Tue Jul 31 01:26:08 2018] 1xx.2xx.1xx.1xx root ubuntu
[Tue Jul 31 01:26:09 2018] 1xx.2xx.1xx.1xx root PassWord
[Tue Jul 31 01:26:10 2018] 1xx.2xx.1xx.1xx root password321
[Tue Jul 31 01:26:15 2018] 1xx.2xx.1xx.1xx root zxcvbnm
```

## Saving results to disk:

Redirecting the output to a log file, running in the foreground as a screen session:

```bash
$ screen -S honeypot
$ docker logs -f f6cb | grep -v 'Error exchanging' | awk '{print $6, $7, $8}' >> /var/log/ssh-honeypot.log
```

Detach from your screen session:

```bash
Ctrl + a; d
```

Checking out the logs

```bash
$ head -3 /var/log/ssh-honeypot.log
2.7.2x.1x root jiefan
4x.7.2x.1x root HowAreYou
4x.7.2x.1x root Sqladmin
```

Leaving this running for a couple of months, and I have a massive password database:

```bash
$ wc -l /var/log/honeypot/ssh.log
54184260 /var/log/honeypot/ssh.log
```

That is correct, 54 million password attempts. 5372 Unique IPs, 4082 Unique Usernames, 88829 Unique Passwords. 
