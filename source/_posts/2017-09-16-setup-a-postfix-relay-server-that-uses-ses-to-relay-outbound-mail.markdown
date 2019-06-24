---
layout: post
title: "Setup a Postfix Relay Server that Uses SES to Relay Outbound Mail"
date: 2017-09-16 18:01:49 -0400
comments: true
categories: ["aws", "mail", "postfix", "ses"] 
---

We will setup a Postfix Relay Servcer which our clients will use to send out mail, the Postfix server will use Amazon's SES Service to send out mail, which we will configure as a relay host in Postfix.

## Setup EC2 Instance to Relay through AWS SES:

Install Postfix and SASL:

```bash
$ apt install postfix mailutils libsasl2-2 sasl2-bin libsasl2-modules -y
```

Section we need to configure in `/etc/postfix/main.cf`:

```bash
relayhost = [email-smtp.eu-west-1.amazonaws.com]:587
smtp_use_tls = yes
smtp_sasl_auth_enable = yes
smtp_sasl_security_options =
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt
```

Populate SASL Passwd:

```bash
$ cat /etc/postfix/sasl_passwd
[email-smtp.eu-west-1.amazonaws.com]:587    AKIAABCDEFGHIJKLM:SomeRandomSecretString
```

Postmap the changes:

```bash
$ postmap /etc/postfix/sasl_passwd
```

Restart Postfix:

```
$ sudo /etc/init.d/postfix restart
```

Test the Mail Flow:

```
$ echo test | mail -r ruan@ruanbekker.com -s 'ses test mail ' ruan@ruanbekker.com && tail -f /var/log/mail.log

Jul 18 11:29:06 ip-10-1-4-250 postfix/smtp[5056]: 9FDCB469AA: to=<ruan@ruanbekker.com>, relay=email-smtp.eu-west-1.amazonaws.com[52.10.20.30]:587, delay=0.29, delays=0.02/0.03/0.12/0.13, dsn=2.0.0, status=sent (250 Ok 0234567d557572f2-76f56252-0a00-4d94-af87-38bd213914d2-000000)
Jul 18 11:29:06 ip-10-1-4-250 postfix/qmgr[4392]: 9FDCB469AA: removed
```

If your output looks more or less like the snippet from above, your mail should be working fine.

<center>
<script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script> 
</center>
