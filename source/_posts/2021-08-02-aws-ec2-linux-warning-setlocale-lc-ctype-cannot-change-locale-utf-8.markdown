---
layout: post
title: "AWS EC2 Linux - warning: setlocale: LC_CTYPE: cannot change locale UTF-8"
date: 2021-08-02 02:40:53 -0400
comments: true
categories: ["ec2", "aws", "linux"]
---

On Amazon Linux EC2 Instances, I noticed the following error when SSH onto them:

```
-bash: warning: setlocale: LC_CTYPE: cannot change locale (UTF-8): No such file or directory
```

To resolve, add the following to the `/etc/environment` file:

```
$ cat /etc/environment
LANG=en_US.utf-8
LC_ALL=en_US.utf-8
```

Logout and log back in and it should be resolved.
