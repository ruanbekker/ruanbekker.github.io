---
layout: post
title: "Setup Hashicorp Vault Server on Docker and a Getting Started CLI Guide"
date: 2019-05-06 16:49:09 -0400
comments: true
categories: ["vault", "secrets", "docker"] 
---
![](https://user-images.githubusercontent.com/567298/57256060-f1a27e00-7055-11e9-9a05-77d3fdd6c76f.png)

Vault is one of Hashicorp's awesome services, which enables you to centrally store, access and distribute dynamic secrets such as tokens, passwords, certificates and encryption keys.

## What will we be doing today

We will setup a Vault Server on Docker and demonstrate a getting started guide with the Vault CLI to Initialize the Vault, Create / Use and Manage Secrets.

## Setting up the Vault Server

Create the directory structure:

```
$ touch docker-compose.yml
$ mkdir -p volumes/{config,file,logs}
```

Populate the vault config `vault.json`. (As you can see the config is local, in the next couple of posts, I will show how to persist this config to Amazon S3)

```
$ cat > volumes/config/vault.json << EOF
{
  "backend": {
    "file": {
      "path": "/vault/file"
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
EOF
```

Populate the `docker-compose.yml`:

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
    entrypoint: vault server -config=/vault/config/vault.json
EOF
```

Start the Vault Server:

```
$ docker-compose up
```

The UI is available at http://localhost:8200/ui and the api at http://localhost:8200

## Interacting with the Vault CLI

I will demonstrate how to use the Vault CLI to interact with Vault. Let's start by installing the vault cli tools, I am using mac, so I will be using brew:

```
$ brew install vault
```

Set environment variables:

```
$ export VAULT_ADDR='http://127.0.0.1:8200'
```

## Initialize the Vault Cluster:

Initialize new vault cluster with 6 key shares:

```
$ vault operator init -key-shares=6 -key-threshold=3
Unseal Key 1: RntjR...DQv
Unseal Key 2: 7E1bG...0LL+
Unseal Key 3: AEuhl...A1NO
Unseal Key 4: bZU76...FMGl
Unseal Key 5: DmEjY...n7Hk
Unseal Key 6: pC4pK...XbKb

Initial Root Token: s.F0JGq..98s2U

Vault initialized with 10 key shares and a key threshold of 3. Please
securely distribute the key shares printed above. When the Vault is re-sealed,
restarted, or stopped, you must supply at least 3 of these keys to unseal it
before it can start servicing requests.

Vault does not store the generated master key. Without at least 3 key to
reconstruct the master key, Vault will remain permanently sealed!

It is possible to generate new unseal keys, provided you have a quorum of
existing unseal keys shares. See "vault operator rekey" for more information.
```

In order to unseal the vault cluster, we need to supply it with 3 key shares:

```
$ vault operator unseal RntjR...DQv
$ vault operator unseal bZU76...FMGl
$ vault operator unseal pC4pK...XbKb
```

Ensure the vault is unsealed:

```
$ vault status -format=json
{
  "type": "shamir",
  "initialized": true,
  "sealed": false,
  "t": 3,
  "n": 5,
  "progress": 0,
  "nonce": "",
  "version": "1.1.0",
  "migration": false,
  "cluster_name": "vault-cluster-dca2b572",
  "cluster_id": "469c2f1d-xx-xx-xx-03bfc497c883",
  "recovery_seal": false
}
```

Authenticate against the vault:

```
$ vault login s.tdlEqsfzGbePVlke5hTpr9Um
Success! You are now authenticated. The token information displayed below
is already stored in the token helper. You do NOT need to run "vault login"
again. Future Vault requests will automatically use this token.
```

Using the cli your auth token will be saved locally at `~/.vault-token`.

Enable the secret kv engine:

```
$ vault secrets enable -version=1 -path=secret kv
```

## Create and Read Secrets

Write a secret to the path enabled above:

```
$ vault kv put secret/my-app/password password=123
```

List your secrets:

```
$ vault kv list secret/
Keys
----
my-app/
```

Read the secret (defaults in table format):

```
$ vault kv get secret/my-app/password
Key                 Value
---                 -----
refresh_interval    768h
password            123
```

Read the secret in json format:

```
$ vault kv get --format=json secret/my-app/password
{
  "request_id": "0249c878-7432-9555-835a-89b275fca32o",
  "lease_id": "",
  "lease_duration": 2764800,
  "renewable": false,
  "data": {
    "password": "123"
  },
  "warnings": null
}
```

Read only the password value in the secret:

```
$ vault kv get -field=password secret/my-app/password
123
```

## Key with Multiple Secrets

Create a key with multiple secrets:

```
$ vault kv put secret/reminders/app db_username=db.ruanbekker.com username=root password=secret
```

Read all the secrets:

```
$ vault kv get --format=json secret/reminders/app
{
  "request_id": "0144c878-7532-9555-835a-8cb275fca3dd",
  "lease_id": "",
  "lease_duration": 2764800,
  "renewable": false,
  "data": {
    "db_username": "db.ruanbekker.com",
    "password": "secret",
    "username": "root"
  },
  "warnings": null
}
```

Read only the username field in the key:

```
$ vault kv get -field=username secret/reminders/app
root
```

Delete the secret:

```
$ vault kv delete secret/reminders
```

## Versioning

Create a key and set the metadata to max of 5 versions:

```
$ vault kv metadata put -max-versions=5 secret/fooapp/appname
```

Get the metadata of the key:

```
$ vault kv metadata get secret/fooapp/appname
======= Metadata =======
Key                Value
---                -----
cas_required       false
created_time       2019-04-07T12:35:54.355411Z
current_version    0
max_versions       5
oldest_version     0
updated_time       2019-04-07T12:35:54.355411Z
```

Write a secret `appname` to our key: `secret/fooapp/appname`:

```
$ vault kv put secret/fooapp/appname appname=app1
Key              Value
---              -----
created_time     2019-04-07T12:36:41.7577102Z
deletion_time    n/a
destroyed        false
version          1
```

Overwrite the key with a couple of requests:

```
$ vault kv put secret/fooapp/appname appname=app2
$ vault kv put secret/fooapp/appname appname=app3
```

Read the current value:

```
$ vault kv get -field=appname secret/fooapp/appname
app3
```

Get the version=2 value of this file:

```
$ vault kv get -field=appname -version=2 secret/fooapp/appname
app2
```

## Thanks

Thanks for reading, hope this was informative. Have a look at [Hashicorp's Vault Documentation](https://www.vaultproject.io) for more information on the project. I will post more posts on Vault under the [#vault](https://blog.ruanbekker.com/blog/categories/vault) category.
