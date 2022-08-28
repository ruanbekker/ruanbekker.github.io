---
layout: post
title: "Setup Kerberos Server and Client on Ubuntu"
date: 2017-10-18 18:25:11 -0400
comments: true
categories: ["authentication", "kerberos", "ubuntu", "linux"] 
---

Kerberos is a authentication protocol that provides a centralized authentication server, that works with the concepts of tickets that are encrypted.

Today we will setup a Kerberos Server (KDC) and setup and Kerberos Enabled Client, and then testing our setup by obtaining a Kerberos Ticket from our server.

## Setup the Server:

Install Kerberos KDC and Admin Server:

```bash
$ apt update && apt upgrade -y
$ apt install krb5-kdc krb5-admin-server krb5-config -y
$ krb5_newrealm
```

You will be prompted for realm, and hostnames, in my case I have setup the following:

- REALM: `LAN.RUANBEKER.COM`
- HOST: `localhost`
- ADMIN_SERVER: `localhost`

Then our master password:

```bash
This script should be run on the master KDC/admin server to initialize
a Kerberos realm.  It will ask you to type in a master key password.
This password will be used to generate a key that is stored in
/etc/krb5kdc/stash.  You should try to remember this password, but it
is much more important that it be a strong password than that it be
remembered.  However, if you lose the password and /etc/krb5kdc/stash,
you cannot decrypt your Kerberos database.
Loading random data
Initializing database '/var/lib/krb5kdc/principal' for realm 'LAN.RUANBEKKER.COM',
master key name 'K/M@LAN.RUANBEKKER.COM'
You will be prompted for the database Master Password.
It is important that you NOT FORGET this password.
Enter KDC database master key: 
Re-enter KDC database master key to verify: 
```

The output:

```bash
Now that your realm is set up you may wish to create an administrative
principal using the addprinc subcommand of the kadmin.local program.
Then, this principal can be added to /etc/krb5kdc/kadm5.acl so that
you can use the kadmin program on other computers.  Kerberos admin
principals usually belong to a single user and end in /admin.  For
example, if jruser is a Kerberos administrator, then in addition to
the normal jruser principal, a jruser/admin principal should be
created.

Don't forget to set up DNS information so your clients can find your
KDC and admin servers.  Doing so is documented in the administration
guide.
```

Uncomment the last line which contains `admin`:

```bash
$ vi /etc/krb5kdc/kadm5.acl
```

a Kerberos principal is a unique identity to which Kerberos can assign tickets, lets add our first principal, `james`:

```bash
$ kadmin.local 
Authenticating as principal root/admin@LAN.RUANBEKKER.COM with password.
kadmin.local:  addprinc james

WARNING: no policy specified for james@LAN.RUANBEKKER.COM; defaulting to no policy
Enter password for principal "james@LAN.RUANBEKKER.COM": 
Re-enter password for principal "james@LAN.RUANBEKKER.COM": 
Principal "james@LAN.RUANBEKKER.COM" created.
kadmin.local:  exit
```

## Setup the Client:

Setup a Host Entry:

```bash
$ echo '10.1.1.1 kdc.lan.ruanbekker.com kdc' >> /etc/hosts
```

Setup Kerberos Client:

```bash
$ apt install krb5-user -y
- realm
- hostname
- hostname
```

Obtain a Ticket from the Server:

```bash
$ kinit -p james
Password for james@LAN.RUANBEKKER.COM: 

$ klist
Ticket cache: FILE:/tmp/krb5cc_0
Default principal: james@LAN.RUANBEKKER.COM

Valid starting     Expires            Service principal
10/18/17 22:13:34  10/19/17 08:13:34  krbtgt/LAN.RUANBEKKER.COM@LAN.RUANBEKKER.COM
	renew until 10/19/17 22:13:30
```

## Resources:

- http://csetutorials.com/setup-kerberos-ubuntu.html
- https://www.rootusers.com/how-to-configure-linux-to-authenticate-using-kerberos/
