---
layout: post
title: "Use the Vault API to Provision App Keys and Create KV Pairs"
date: 2019-05-07 16:23:10 -0400
comments: true
categories: ["hashicorp", "vault", "api", "secrets", "secrets-management"] 
---

![](https://user-images.githubusercontent.com/567298/57256060-f1a27e00-7055-11e9-9a05-77d3fdd6c76f.png)

In this tutorial we will use Vault API to create a user and allow that user to write/read key/value pairs from a given path.

Related Posts:

* [Setup a Vault Server on Docker](https://blog.ruanbekker.com/blog/2019/05/06/setup-hashicorp-vault-server-on-docker-and-cli-guide/)
* [Getting Started with the Vault CLI](https://blog.ruanbekker.com/blog/2019/05/06/setup-hashicorp-vault-server-on-docker-and-cli-guide/)
* [Use the S3 Storage Backend to Persist Data](https://blog.ruanbekker.com/blog/2019/05/07/persist-vault-data-with-amazon-s3-as-a-storage-backend/)
* [Create Secrets with Vaults Transit Secret Engine](https://blog.ruanbekker.com/blog/2019/05/07/create-secrets-with-vaults-transits-secret-engine/)

## Credentials / Authentication

Export Vault Root Tokens:

```
$ export ROOT_TOKEN="$(cat ~/.vault-token)"
$ export VAULT_TOKEN=${ROOT_TOKEN}
```

Check the vault status:

```
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/sys/health | jq
{
  "initialized": true,
  "sealed": false,
  "standby": false,
  "performance_standby": false,
  "replication_performance_mode": "disabled",
  "replication_dr_mode": "disabled",
  "server_time_utc": 1554652468,
  "version": "1.1.0",
  "cluster_name": "vault-cluster-bfb00cd7",
  "cluster_id": "dc1dc9a6-xx-xx-xx-a2870f475e7a"
}
```

Do a lookup for the root user:

```
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/auth/token/lookup-self | jq
{
  "request_id": "69a19f66-5bad-3af2-81a5-81ca24e50b02",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "accessor": "A7Xkik1ebWpUfzqNrvADmQ08",
    "creation_time": 1554651149,
    "creation_ttl": 0,
    "display_name": "root",
    "entity_id": "",
    "expire_time": null,
    "explicit_max_ttl": 0,
    "id": "s.po8HkMdCnnAerlCAeHGGGszQ",
    "meta": null,
    "num_uses": 0,
    "orphan": true,
    "path": "auth/token/root",
    "policies": [
      "root"
    ],
    "ttl": 0,
    "type": "service"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

## Create the Roles

Create the AppRole:

```
$ curl -s -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" -d '{"type": "approle"}' http://127.0.0.1:8200/v1/sys/auth/approle | jq
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/sys/auth | jq
{
  "token/": {
    "accessor": "auth_token_31f2381e",
    "config": {
      "default_lease_ttl": 0,
      "force_no_cache": false,
      "max_lease_ttl": 0,
      "token_type": "default-service"
    },
    "description": "token based credentials",
    "local": false,
    "options": null,
    "seal_wrap": false,
    "type": "token"
  },
  "approle/": {
    "accessor": "auth_approle_d542dcad",
    "config": {
      "default_lease_ttl": 0,
      "force_no_cache": false,
      "max_lease_ttl": 0,
      "token_type": "default-service"
    },
    "description": "",
    "local": false,
    "options": {},
    "seal_wrap": false,
    "type": "approle"
  },
  "request_id": "20554948-b8e0-4254-f21d-f9ad25f1e5d5",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "approle/": {
      "accessor": "auth_approle_d542dcad",
      "config": {
        "default_lease_ttl": 0,
        "force_no_cache": false,
        "max_lease_ttl": 0,
        "token_type": "default-service"
      },
      "description": "",
      "local": false,
      "options": {},
      "seal_wrap": false,
      "type": "approle"
    },
    "token/": {
      "accessor": "auth_token_31f2381e",
      "config": {
        "default_lease_ttl": 0,
        "force_no_cache": false,
        "max_lease_ttl": 0,
        "token_type": "default-service"
      },
      "description": "token based credentials",
      "local": false,
      "options": null,
      "seal_wrap": false,
      "type": "token"
    }
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```
Create the test policy:

```
$ curl -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" -d '{"policy": "{\"name\": \"test\", \"path\": {\"secret/*\": {\"policy\": \"write\"}}}"}' http://127.0.0.1:8200/v1/sys/policy/test
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/sys/policy/test | jq
{
  "name": "test",
  "rules": "{\"name\": \"test\", \"path\": {\"secret/*\": {\"policy\": \"write\"}}}",
  "request_id": "e4f55dc0-575f-ead9-48f6-43154153889a",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "name": "test",
    "rules": "{\"name\": \"test\", \"path\": {\"secret/*\": {\"policy\": \"write\"}}}"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Attach the policy to the approle:

```
$ curl -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" -d '{"policies": "test"}' http://127.0.0.1:8200/v1/auth/approle/role/app
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" 'http://127.0.0.1:8200/v1/auth/approle/role?list=true' | jq .
{
  "request_id": "e645cad9-9010-4299-0e6b-0baf6d9194b8",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "keys": [
      "app"
    ]
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Enable the kv store:

```
$ curl -H "X-Vault-Token: ${VAULT_TOKEN}" -XPOST --data '{"type": "kv", "description": "my key value store", "config": {"force_no_cache": true}}' http://127.0.0.1:8200/v1/sys/mounts/secret
```

## Create the User Credentials

Get the role_id:

```
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/auth/approle/role/app/role-id | jq
{
  "request_id": "e803a1bf-a492-dad7-68db-bb1506752e03",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "role_id": "3e365c72-7aad-f4e4-521c-d7cf0dd83c0f"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Create the secret_id:

```
$ curl -s -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/auth/approle/role/app/secret-id | jq
{
  "request_id": "b56d20c0-ff8a-a1fe-4d5f-42e57b625b83",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "secret_id": "5eecfe29-d6e1-50e6-7a70-04c6bea42b76",
    "secret_id_accessor": "2fa80586-32b9-1c6f-fe1d-7c547e5403e5"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Create the token with the role_id and secret_id:

```
$ curl -s -XPOST -d '{"role_id": "3e365c72-7aad-f4e4-521c-d7cf0dd83c0f","secret_id": "5eecfe29-d6e1-50e6-7a70-04c6bea42b76"}' http://127.0.0.1:8200/v1/auth/approle/login | jq
{
  "request_id": "82470940-ef09-bcbb-f7a0-bdf085b4f47b",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": null,
  "wrap_info": null,
  "warnings": null,
  "auth": {
    "client_token": "s.7EtwtRGsZWOtkqcMvj3UMLP0",
    "accessor": "2TPL1vg5IZXgVF6Xf1RRzbmL",
    "policies": [
      "default",
      "test"
    ],
    "token_policies": [
      "default",
      "test"
    ],
    "metadata": {
      "role_name": "app"
    },
    "lease_duration": 2764800,
    "renewable": true,
    "entity_id": "d5051b01-b7ce-626c-a9f4-e1663f8c23e8",
    "token_type": "service",
    "orphan": true
  }
}
```

## Create KV Pairs with New User

Export the user auth with the received token:

```
$ export APP_TOKEN=s.7EtwtRGsZWOtkqcMvj3UMLP0
$ export VAULT_TOKEN=$APP_TOKEN
```

Verify if you can lookup your own info:

```
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/auth/token/lookup-self | jq
{
  "request_id": "2e69cd68-8668-3159-6440-c430cb61d2e6",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "accessor": "2TPL1vg5IZXgVF6Xf1RRzbmL",
    "creation_time": 1554651882,
    "creation_ttl": 2764800,
    "display_name": "approle",
    "entity_id": "d5051b01-b7ce-626c-a9f4-e1663f8c23e8",
    "expire_time": "2019-05-09T15:44:42.1013993Z",
    "explicit_max_ttl": 0,
    "id": "s.7EtwtRGsZWOtkqcMvj3UMLP0",
    "issue_time": "2019-04-07T15:44:42.1013788Z",
    "meta": {
      "role_name": "app"
    },
    "num_uses": 0,
    "orphan": true,
    "path": "auth/approle/login",
    "policies": [
      "default",
      "test"
    ],
    "renewable": true,
    "ttl": 2764556,
    "type": "service"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Create a KV pair:

```
$ curl -s -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" -d '{"app_password": "secret123"}' http://127.0.0.1:8200/v1/secret/app01/app_password
```

Read the secret from KV pair:

```
$ curl -s -XGET -H "X-Vault-Token: ${VAULT_TOKEN}" http://127.0.0.1:8200/v1/secret/app01/app_password | jq
{
  "request_id": "70d5f16d-2abb-fcfd-063f-0e21d9cef8fd",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 2764800,
  "data": {
    "app_password": "secret123"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

Try to write outside the allowed path:

```
$ curl -s -XPOST -H "X-Vault-Token: ${VAULT_TOKEN}" -d '{"app_password": "secret123"}' http://127.0.0.1:8200/v1/secrets/app01/app_password
{"errors":["1 error occurred:\n\t* permission denied\n\n"]}
```

## Resources:

- https://www.vaultproject.io/api/system/audit.html
- https://learn.hashicorp.com/vault/getting-started/apis
- https://www.hashicorp.com/resources/getting-vault-enterprise-installed-running
