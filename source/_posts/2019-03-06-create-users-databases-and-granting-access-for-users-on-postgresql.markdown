---
layout: post
title: "Create Users Databases and Granting Access for Users on PostgreSQL"
date: 2019-03-06 16:28:25 -0500
comments: true
categories: ["postgres", "postgresql",  "databases"] 
---

Short tutorial on how to create databases on postgresql, creating users and granting permissions so that the users has access to the created database.

## Create and Apply Permissions

Logon to postgresL

```bash
$ sudo -u postgres psql
psql=>
```

Create the database `mydb`:

```sql
psql=> create database mydb;
```

Create the user `dba` and assign a password:

```sql
psql=> create user concourse with encrypted password 'sekretpw';
```

Grant all privileges for the user on the database:

```sql
psql=> grant all privileges on database concourse1 to concourse;
psql=> \q
```

## Allowing Remote Conenctions

If you want to allow remote connections, you would first need to change the config that the server listens on all interfaces:

```bash
# /etc/postgresql/10/main/postgresql.conf 
listen_addresses = '0.0.0.0'
```

We also the need to update the trust relationship, in this case we will only want one user to access one database from any source:

```bash
# /etc/postgresql/10/main/pg_hba.conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
hostnossl mydb		dba		0.0.0.0/0  		trust
```

After the config is in place, restart the server:

```bash
$ /etc/init.d/postgresql restart
```

## PostgreSQL Client

From a remote source, test the connection to your server:

```bash
$ psql --host postgres.example.com --username dba --dbname mydb --password
Password:
psql (11.1, server 10.5 (Ubuntu 10.5-1.pgdg16.04+1))
Type "help" for help.

mydb=>
```


