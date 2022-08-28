---
layout: post
title: "Persist Vault Data with Amazon S3 as a Storage Backend"
date: 2019-05-07 16:01:45 -0400
comments: true
categories: ["hashicorp", "vault", "persistence", "storage", "secrets", "s3"] 
---

![](https://user-images.githubusercontent.com/567298/57256060-f1a27e00-7055-11e9-9a05-77d3fdd6c76f.png)

In a previous post we have set up [the vault server on docker](https://blog.ruanbekker.com/blog/2019/05/06/setup-hashicorp-vault-server-on-docker-and-cli-guide/), but using a file backend to persist our data. 

In this tutorial we will configure vault to use [amazon s3 as a storage backend](https://www.vaultproject.io/docs/configuration/storage/s3.html) to persist our data for vault.

## Provision S3 Bucket

Create the S3 Bucket where our data will reside:

```
$ aws s3 mb --region=eu-west-1 s3://somename-vault-backend
```

## Vault Config

Create the vault config, where we will provide details about our storage backend and configuration for the vault server:

```
$ vim volumes/config/s3vault.json
```

Populate the config file with the following details, you will just need to provide your own credentials:

```json
{
  "backend": {
    "s3": {
      "region": "eu-west-1",
      "access_key": "ACCESS_KEY",
      "secret_key": "SECRET_KEY",
      "bucket": "somename-vault-backend"
    }
  },
  "listener": {
    "tcp":{
      "address": "0.0.0.0:8200",
      "tls_disable": 1
    }
  },
  "ui": true
}
```

## Docker Compose

As we are using docker to deploy our vault server, our docker-compose.yml:

```
$ cat > docker-compose.yml << EOF
version: '2'
services:
  vault:
    image: vault
    container_name: vault
    ports:
      - "8200:8200"
    restart: always
    volumes:
      - ./volumes/logs:/vault/logs
      - ./volumes/file:/vault/file
      - ./volumes/config:/vault/config
    cap_add:
      - IPC_LOCK
    entrypoint: vault server -config=/vault/config/s3vault.json
EOF
```

Deploy the vault server:

```
$ docker-compose up
```

Go ahead and create some secrets, then deploy the docker container on another host to test out the data persistence.
