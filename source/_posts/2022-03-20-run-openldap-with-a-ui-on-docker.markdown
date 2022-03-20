---
layout: post
title: "Run OpenLDAP with a UI on Docker"
date: 2022-03-20 16:55:39 -0400
comments: true
categories: ["openldap", "docker", "authentication"]
---

In this tutorial we will setup two containers, openldap and a openldap ui to manage our users on openldap.

## What is OpenLDAP

OpenLDAP is an open source implementation of the Lightweight Directory Access Protocol, which makes it possible for organizations to use centralized authentication and directory access services over a network.

## Configuration

This stack will boot a openldap and openldap-ui container container with the following `docker-compose.yml`:

```yaml
version: "3.8"

services:
  openldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    volumes:
      - ./storage/ldap_db:/var/lib/ldap
      - ./storage/ldap_config:/etc/ldap/slapd.d
    environment:
      - LDAP_ORGANISATION=example-org
      - LDAP_DOMAIN=example.org
      - LDAP_ADMIN_PASSWORD=admin
      - LDAP_CONFIG_PASSWORD=config
      - LDAP_RFC2307BIS_SCHEMA=true
      - LDAP_REMOVE_CONFIG_AFTER_SETUP=true
      - LDAP_TLS_VERIFY_CLIENT=never
    networks:
      - openldap

  openldap-ui:
    image: wheelybird/ldap-user-manager:v1.5
    container_name: openldap-ui
    environment:
      - LDAP_URI=ldap://openldap
      - LDAP_BASE_DN=dc=example,dc=org
      - LDAP_REQUIRE_STARTTLS=FALSE
      - LDAP_ADMINS_GROUP=admins
      - LDAP_ADMIN_BIND_DN=cn=admin,dc=example,dc=org
      - LDAP_ADMIN_BIND_PWD=admin
      - LDAP_IGNORE_CERT_ERRORS=true
      - NO_HTTPS=TRUE
      - PASSWORD_HASH=SSHA
      - SERVER_HOSTNAME=localhost:18080
    depends_on:
      - openldap
    ports:
      - 18080:80
    networks:
      - openldap

networks:
  openldap:
    name: openldap
```

## Boot

Boot the stack with docker-compose:

```bash
docker-compose up -d
```

You can access OpenLDAP-UI on port `18080` and the admin password will be `admin`. You will have admin access to create users.

## Verify Users

Access the openldap container:

```bash
docker-compose exec openldap bash
```

You can use `ldapsearch` to verify our user:

```bash
ldapsearch -x -h openldap -D "uid=ruan,ou=people,dc=example,dc=org" -b "ou=people,dc=example,dc=org" -w "$PASSWORD" -s base 'uid=ruan'
```

Or we can use `ldapwhoami`:

```bash
ldapwhoami -vvv -h ldap://openldap:389 -p 389 -D 'uid=ruan,ou=people,dc=example,dc=org' -x -w "$PASSWORD"
```

Which will provide a output with something like:

```bash
ldap_initialize( <DEFAULT> )
dn:uid=ruan,ou=people,dc=example,dc=org
Result: Success (0)
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
