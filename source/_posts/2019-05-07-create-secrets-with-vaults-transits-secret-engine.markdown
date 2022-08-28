---
layout: post
title: "Create Secrets with Vaults Transits Secret Engine"
date: 2019-05-07 16:31:54 -0400
comments: true
categories: ["vault", "hashicorp", "encryption", "secrets"] 
---

![](https://camo.githubusercontent.com/b2223b0ca7077fcf9919372582183757239e4153/68747470733a2f2f6c6561726e2e6861736869636f72702e636f6d2f6173736574732f696d616765732f7661756c742d656e6372797074696f6e2e706e67)

Vault's transit secrets engine handles cryptographic functions on data-in-transit. Vault doesn't store the data sent to the secrets engine, so it can also be viewed as encryption as a service.

In this tutorial we will demonstrate how to use Vault's Transit Secret Engine.

Related Posts:

* [Setup a Vault Server on Docker](https://blog.ruanbekker.com/blog/2019/05/06/setup-hashicorp-vault-server-on-docker-and-cli-guide/)
* [Use the S3 Storage Backend to Persist Data](https://blog.ruanbekker.com/blog/2019/05/07/persist-vault-data-with-amazon-s3-as-a-storage-backend/)

## Enable the Transit Engine:

Enable transit secret engine using the /sys/mounts endpoint:

```
$ curl --header "X-Vault-Token: $VAULT_TOKEN" -XPOST -d '{"type": "transit", "description": "encs encryption"}' http://127.0.0.1:8200/v1/sys/mounts/transit
```

## Create the Key Ring:

Create an encryption key ring named `fookey` using the transit/keys endpoint:

```
$ curl -s --header "X-Vault-Token: $VAULT_TOKEN" -XGET http://127.0.0.1:8200/v1/transit/keys/fookey | jq
{
  "request_id": "8375227a-4a9f-a108-0b89-84c448419e80",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "allow_plaintext_backup": false,
    "deletion_allowed": false,
    "derived": false,
    "exportable": false,
    "keys": {
      "1": 1554654295
    },
    "latest_version": 1,
    "min_available_version": 0,
    "min_decryption_version": 1,
    "min_encryption_version": 0,
    "name": "fookey",
    "supports_decryption": true,
    "supports_derivation": true,
    "supports_encryption": true,
    "supports_signing": false,
    "type": "aes256-gcm96"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

## Encoding

Encode your string:

```
$ base64 <<< "hello world"
aGVsbG8gd29ybGQK
```

## Encrypt

To encrypt your secret, use the transit/encrypt endpoint:

```
$ curl -s --header "X-Vault-Token: $VAULT_TOKEN" --request POST  --data '{"plaintext": "aGVsbG8gd29ybGQK"}' http://127.0.0.1:8200/v1/transit/encrypt/fookey | jq
{
  "request_id": "ab00ba0f-9e45-0aca-e3c1-7765fd83fc3c",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "ciphertext": "vault:v1:Yo4U6xXFM2FoBOaUrw0w3EpSlJS6gmsa4HP1xKtjrk0+xSqi5Rvjvg=="
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

## Decrypt:

Use the transit/decrypt endpoint to decrypt the ciphertext:

```
$ curl -s --header "X-Vault-Token: $VAULT_TOKEN" --request POST  --data '{"ciphertext": "vault:v1:Yo4U6xXFM2FoBOaUrw0w3EpSlJS6gmsa4HP1xKtjrk0+xSqi5Rvjvg=="}' http://127.0.0.1:8200/v1/transit/decrypt/fookey | jq
{
  "request_id": "3d9743a0-2daf-823c-f413-8c8a90753479",
  "lease_id": "",
  "renewable": false,
  "lease_duration": 0,
  "data": {
    "plaintext": "aGVsbG8gd29ybGQK"
  },
  "wrap_info": null,
  "warnings": null,
  "auth": null
}
```

## Decoding

Decode the response:

```
$ base64 --decode <<< "aGVsbG8gd29ybGQK"
hello world
```

## Resources

* [Vault Documentation on this topic](https://learn.hashicorp.com/vault/encryption-as-a-service/eaas-transit)
