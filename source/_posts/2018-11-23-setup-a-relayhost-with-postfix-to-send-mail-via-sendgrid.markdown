---
layout: post
title: "Setup a Relayhost with Postfix to Send Mail via Sendgrid"
date: 2018-11-23 07:40:49 -0500
comments: true
categories: ["sendgrid", "email", "postfix"] 
---

![](https://objects.ruanbekker.com/assets/images/sendgrid-logo.png)

In this post we will setup Postfix to Relay Mail through SendGrid and we will also configure the authentication as SendGrid is not an open relay, but you can obtain credentials by signing up with the for a free account to obtain your username and password which will use to relay mail through them.

## Access Control on Postfix

For this demonstration we can make use of the mynetworks configuration to specify the cidr of the source which we want to allow clients to be able to relay from. This is a acceptable way of controlling which source addresses you would like to authorize to relay mail via your smtp relay server.

## Sendgrid

Sendgrid offers 100 free outbound emails per day, sign up with them via [sendgrid.com/free](https://sendgrid.com/free/), create a API Key and save your credentials in a safe place.

You first need to verify your account by sending a mail using their API, but it's step by step so won't take more than 2 minutes to complete.

## Setup Postifx

I will be using ubuntu to setup postfix and configure postfix to specify sendgrid as the relayhost and also configure the authentication for the destination server in question:

```bash
$ apt install postfix libsasl2-modules -y
```

Configure postfix to relay all outbound mail via sendgrid, enable sasl auth, tls, relayhost etc via `/etc/postfix/main.cf`. The settings that needs to be set/configured:

```bash
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_sasl_tls_security_options = noanonymous
smtp_tls_security_level = encrypt
header_size_limit = 4096000
relayhost = [smtp.sendgrid.net]:587
mynetworks = /etc/postfix/mynetworks
```

Create the `/etc/postfix/mynetworks` file where the whitelisted source addresses will be specified. In our case the loopback address and the class c subnet 10.0.1.0 :

```
127.0.0.1/32
10.0.1.0/24
```

Create the credential file where the credentials for the sendgrid service will be stored, in my case it will be in `/etc/postfix/sasl_passwd`:

```bash
[smtp.sendgrid.net]:587 your_username:your_password
```

Apply permissions and update postfix hashtables on the file in question:

```bash
$ chmod 600 /etc/postfix/sasl_passwd
$ postmap /etc/postfix/sasl_passwd
```

Enable and Start the Service:

```bash
$ systemctl enable postfix
$ systemctl restart postfix
```

## Send a Test Mail

From the server you can test your mail delivery by sending a mail:

```bash
$ echo "the body of the mail" | mail -r user@authenticated-domain.com -s "my subject" recipient-mail@mydomain.com
```

or using telnet for a remote system:

```bash
$ telnet smtp-server.ip 25
helo admin
mail from: me@mydomain.com
rcpt to: recipient-main@mydomain.com
DATA
Subject: This is a test
From: James John <me@mydomain.com>
To: Peter Smith <recipient-mail@mydomain.com> 

ctrl + ]
q
```

You can monitor `/var/log/maillog` to see log messages of your email.

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
