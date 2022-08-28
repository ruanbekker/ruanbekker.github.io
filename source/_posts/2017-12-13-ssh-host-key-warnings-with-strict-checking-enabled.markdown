---
layout: post
title: "SSH Host Key Warnings with Strict Checking Enabled"
date: 2017-12-13 02:07:29 -0500
comments: true
categories: ["ssh", "linux"] 
---

When you format / reload a server and the host gets the same IP, when you try to SSH to that host, you might get a warning like this:

```bash
$ ssh 192.168.1.104
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
a1:a2:a3:a4:a5:a6:a7:a8:a9:b0:b1:b2:b3:b4:b5:b6.
Please contact your system administrator.
Add correct host key in /home/pi/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/pi/.ssh/known_hosts:10
ECDSA host key for 192.168.1.104 has changed and you have requested strict checking.
Host key verification failed.
```

This is because we have `StrictMode` enabled in our SSH Configuration:

```bash
$ cat /etc/ssh/sshd_config | grep -i stric
StrictModes yes
```

To remove the offending key from your `known_hosts` file, without opening it, you can use `ssh-keygen` to remove it:

```bash
$ ssh-keygen -f .ssh/known_hosts -R 192.168.1.104
# Host 192.168.1.104 found: line 10 type ECDSA
.ssh/known_hosts updated.
Original contents retained as .ssh/known_hosts.old
```

Now when you SSH the warning should be removed.
