---
layout: post
title: "Sending Mail with SSMTP on Alpine Linux"
date: 2017-10-09 16:36:35 -0400
comments: true
categories: ["mail", "ssmtp", "alpine", "linux"]
---

Quick Post on how to use ssmtp on Alpine Linux to Send Mail:

## Update and Install SSMTP

```bash
$ apk update
$ apk add ssmtp
```

## Configure SSMTP

```bash
$ cat > /etc/ssmtp/ssmtp.conf << EOF
root=postmaster
mailhub=mail.domain.com:25
hostname=`hostname`
FromLineOverride=YES
EOF
```

## Create the Mail Content

```bash
$ cat > mail.txt << EOF
To: recipient@domain.com
From: sender@domain.com
Subject: Mail with SSMTP

Hello, this is a test mail.
EOF
```

## Testing Mail Delivery

```bash
$ ssmtp recipient@domain.com < file.txt
```

## Related:

- [Using Gmail as a Relay Host](https://support.cloud.engineyard.com/hc/en-us/articles/205407478-Set-Up-SSMTP-for-Mail-Relay-to-AuthSMTP)
