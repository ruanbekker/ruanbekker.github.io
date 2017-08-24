---
layout: post
title: "Setup MongoDB Client on CentOS 6"
date: 2017-08-24 08:58:10 -0400
comments: true
categories: ["mongodb", "centos"]
---

I have a bastion host that is still running CentOS6 and epel repos provides mongodb-shell version 2.x and Mlab requires version 3.x

## Setup the Repositories

Create the repository:

```
$ cat > /etc/yum.repos.d/mongodb.repo << EOF
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
EOF
```

Update the repository index:

```
$ sudo yum update -y
```

## Install MongoDB-Shell

Install the MongoDB Shell Client:

```
$ sudo yum install mongodb-shell -y
```

## Connect to your Remote MongoDB Instance:

```
$ mongo remotedb.mlab.com:27017/<dbname> -u <user> -p <pass>
```

