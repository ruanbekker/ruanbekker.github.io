---
layout: post
title: "Setup Payara Application Server on Ubuntu 16.04"
date: 2018-03-29 19:57:40 -0400
comments: true
categories: ["java", "payara", "ubuntu"] 
---

![](https://i.snag.gy/CJMlTj.jpg)

Today we will setup Payara 5 on Ubuntu 16.04

## About:

Payara is an Open Source Java Application Server.

## Pre-Requirements:

Update and Install Java 8:

```bash
$ apt update && apt upgrade -y
$ apt-get install wget curl unzip software-properties-common python-software-properties -y
$ add-apt-repository ppa:webupd8team/java
$ apt-get update
$ apt-get install oracle-java8-installer -y
$ source /etc/profile.d/jdk.sh
```

## Install Payara:

Download and Install Payara 5:

```bash
$ cd /usr/local
$ wget --content-disposition 'https://info.payara.fish/cs/c/?cta_guid=b9609f35-f630-492f-b3c0-238fc55f489b&placement_guid=7cca6202-06a3-4c29-aee0-ca58af60528a&portal_id=334594&redirect_url=APefjpGt1aFvHUflpzz7Lec8jDz7CbeIIHZmgORmDSpteTCT2XjiMvjEzeY8yte3kiHi7Ph9mWDB7qUDEr96P0JS8Ev2ZFqahif2huSBfQV6lt4S6YUQpzPMrpHgf_n4VPV62NjKe8vLZBLnYkUALyR2mkrU3vWe7ME9XjHJqYPsHtxkHn-W7bYPFgY2LjEzKIYrdUsCviMgGrUh_LIbLxCESBa0N90vzaWKjK5EwZT021VaPP0jgfgvt0gF2UdtBQGcsTHrAlrb&hsutk=c279766888b67917a591ec4e209cb29a&canon=https%3A%2F%2Fwww.payara.fish%2Fall_downloads&click=5bad781c-f4f5-422d-ba2b-5e0c2bff7098&utm_referrer=https%3A%2F%2Fwww.google.co.za%2F&__hstc=229474563.c279766888b67917a591ec4e209cb29a.1519832301251.1521408251653.1521485598794.4&__hssc=229474563.7.1521485598794&__hsfp=2442083907'

$ unzip payara-5.181.zip
$ mv payara5 payara
$ rm -rf payara-5.181.zip
```

## Permissions:

Create the Payara user and Grant Permissions:

```bash
$ echo 'export PATH=/usr/local/payara/glassfish/bin:$PATH' > /etc/profile.d/payara.sh
$ addgroup --system payara
$ adduser --system --shell /bin/bash --ingroup payara payara
$ echo 'payara soft nofile 32768' >> /etc/security/limits.conf
$ echo 'payara hard nofile 65536' >> /etc/security/limits.conf
$ chown -R payara:payara /usr/local/payara
```

## Setup the Payara Domain:

Switch to the Payara user, delete the default domain and start the production domain. It is useful to configure the JVM Options under the domains config directory according to your servers resources.

```bash
$ su - payara

$ asadmin delete-domain domain1
$ asadmin change-admin-password --domain_name production # default blank pass for admin
$ asadmin --port 4848 enable-secure-admin production

$ asadmin start-domain production
$ asadmin stop-domain production

$ exit
```

## SystemD Unit File:

Create the SystemD Unit File to be able to manage the state of the Payara Server via SystemD:

```bash
$ cat > /etc/systemd/system/payara.service << EOF
[Unit]
Description=Payara Server
After=network.target remote-fs.target
 
[Service]
User=payara
WorkingDirectory=/usr/local/payara/glassfish
Environment=PATH=/usr/local/payara/glassfish/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/jvm/java-8-oracle/bin:/usr/lib/jvm/java-8-oracle/db/bin:/usr/lib/jvm/java-8-oracle/jre/bin
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/payara/glassfish/bin/asadmin start-domain production
ExecReload=/usr/local/payara/glassfish/bin/asadmin restart-domain production
ExecStop=/usr/local/payara/glassfish/bin/asadmin stop-domain production
TimeoutStartSec=300
TimeoutStopSec=30
 
[Install]
WantedBy = multi-user.target
EOF
```

Reload the systemd daemon:

```bash
$ systemctl daemon-reload
```

Start the Payara Service:

```bash
$ systemctl enable payara
$ systemctl start payara
```

Verify that port 4848, 8080 and 8181 is running:

```bash
$ netstat -tulpn | grep java
tcp        0      0 :::8080                     :::*                        LISTEN      24542/java
tcp        0      0 :::4848                     :::*                        LISTEN      24542/java
tcp        0      0 :::8181                     :::*                        LISTEN      24542/java
...
```

## Access Payara Admin UI:

Access the Payara DAS via `https://ip-of-payara-server:4848`
