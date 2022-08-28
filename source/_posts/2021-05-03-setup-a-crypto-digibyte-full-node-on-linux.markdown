---
layout: post
title: "Setup a Crypto Digibyte Full Node on Linux"
date: 2021-05-03 17:14:49 -0400
comments: true
description: "setup a cryptocurrency full node for digibyte on a linux server"
categories: ["digibyte", "crypto", "cryptocurrency"] 
---

![](https://upload.wikimedia.org/wikipedia/en/8/8f/DigiByte_logo.svg)

In this tutorial I will show you how to setup a digibyte (DGB) Full Node on Linux and show you how to interact with your wallet and the blockchain.

## What is a Full Node

By running a Full Node, you contribute by helping to fully validate transactions and blocks. Almost all full nodes also help the network by accepting transactions and blocks from other full nodes, validating those transactions and blocks and then relaying them to other full nodes. Therefore you are contributing to maintaining the consensus of the blockchain.

## Hardware Requirements

In order to run a full digibyte node you will need a server that is preferrably online 24/7 and that you have an uncapped connection as at the time of writing the digibyte blockchain is about 25GB in size but increases over time. I also used a server with 2vCPU's and 4GB of memory.

## Setup the Pre-Requisites

First create the user:

```bash
$ useradd -G sudo digibyte -m -s /bin/bash
$ echo "digibyte ALL=(ALL:ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/no-sudo-password-for-digibyte
```

Create the configuration directory:

```bash
$ mkdir -p /etc/digibyte /var/lib/digibyte
```

Create the digibyte configuration file:

```bash
$ cat <<EOF > /etc/digibyte/digibyte.conf
daemon=1
maxconnections=300
disablewallet=0
rpcuser=jsonrpc
rpcpassword=$(openssl rand -base64 18)
EOF
```

## Download the Software

Get the [latest](https://github.com/DigiByte-Core/digibyte/releases) release, but at the time of writing v7.17.2 is the latest:

```bash
$ wget https://github.com/DigiByte-Core/digibyte/releases/download/v7.17.2/digibyte-7.17.2-x86_64-linux-gnu.tar.gz
$ tar -xf digibyte-7.17.2-x86_64-linux-gnu.tar.gz
$ mv digibyte-7.17.2 /usr/local/digibyte-7.17.2
```

Then symbolic link the version directory to digibyte:

```bash
$ ln -s /usr/local/digibyte-7.17.2 /usr/local/digibyte
```

## SystemD

Create the systemd unit file:

```
$ cat <<EOF > /etc/systemd/system/digibyted.service
[Unit]
Description=DigiByte's distributed currency daemon
After=network.target

[Service]
User=digibyte
Group=digibyte

Type=forking
PIDFile=/etc/digibyte/digibyted.pid
ExecStart=/usr/local/digibyte/bin/digibyted -daemon -pid=/etc/digibyte/digibyted.pid \
  -conf=/etc/digibyte/digibyte.conf -datadir=/var/lib/digibyte -deprecatedrpc=accounts 

Restart=always
PrivateTmp=true
TimeoutStopSec=60s
TimeoutStartSec=2s
StartLimitInterval=120s
StartLimitBurst=5

[Install]
WantedBy=multi-user.target
EOF
```

Change the ownerships to digibyte:

```bash
$ chown -R digibyte:digibyte /etc/digibyte /var/lib/digibyte
```

Enable and start the service:

```bash
$ systemctl enable digibyted.service
$ systemctl start digibyted.service
```

Check the log:

```bash
$ tail -f /var/lib/digibyte/debug.log
```

## Interact with the Node

Check the uptime:

```bash
$ curl -XPOST -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id": "curl", "method": "uptime", "params": []}'
```

Check the wallet address:

```bash
$ curl -XPOST -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id": "curl", "method": "getaccountaddress", "params": []}'
{"result":"D7ZznMe4NyEkXd6zA6MB3GYXiAURo64hNs","error":null,"id":"curl"}
```

Get the account balance:

```bash
$ curl -XPOST -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id": "curl", "method": "getbalance", "params": []}'
{"result":0.00000000,"error":null,"id":"curl"}
```

Using the digibyte-cli:

```bash
$ /usr/local/digibyte/bin/digibyte-cli -getinfo
{
  "version": 7170200,
  "protocolversion": 70017,
  "walletversion": 169900,
  "balance": 0.00000000,
  "blocks": 183019,
  "timeoffset": 0,
  "connections": 8,
  "proxy": "",
  "difficulty": null,
  "testnet": false,
  "keypoololdest": 1619558662,
  "keypoolsize": 1000,
  "paytxfee": 0.00000000,
  "relayfee": 0.00001000,
  "warnings": ""
}
```

## Making a Transaction to my Wallet

Let's make a transaction to my wallet node from a crypto currency exchange where I have digibyte, so first to get the wallet address where we would like to deposit the crypto currency:

```bash
$ curl -XPOST -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id": "curl", "method": "getaccountaddress", "params": []}'
{"result":"D7ZznMe4NyEkXd6zA6MB3GYXiAURo64hNs","error":null,"id":"curl"}
```

From a exchange where you have DGB, withdraw to the address DN8RMAUz2yHGW1PuuLtiSkiTZARzMJ4L2A which is your wallet on the node (ensure you have enough to cover the transaction fee).

Once the transaction has enough confirmations, have a look at your wallet balance, and you will see the 5 DGB that I sent to my wallet can be seen:

```bash
$ curl -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id": "curl", "method": "getbalance", "params": [""]}'
{"result":5.00000000,"error":null,"id":"curl"}
```

I've setup a software wallet on my pc, and from DGB I selected receive and copied my DGB software wallet address, now I would like to transfer my funds from my node wallet to my software wallet:

```bash
$ curl -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id":"curl", "method": "sendtoaddress", "params": ["DTqHG9KA3oQAywq18gpBknxHXHZviyYdvS", 5.0, "donation", "happy bday"] }'
{"result":null,"error":{"code":-4,"message":"Error: This transaction requires a transaction fee of at least 0.0004324"},"id":"curl"}
```

As you can see I don't have enough in my nodes wallet to make the transaction, therefore I need to keep the transaction cost in consideration:

```bash
$ python3 -c 'print(5.0-0.0004324)'
4.9995676
```

So let's send `4.998`:

```bash
$ curl -H 'Content-Type: application/json' -u "jsonrpc:$PASSWORD" http://localhost:14022 -d '{"jsonrpc": "1.0", "id":"curl", "method": "sendtoaddress", "params": ["DTqHG9KA3oQAywq18gpBknxHXHZviyYdvS", 4.998, "donation", "happy bday"] }'
{"result":"260e49b72f17f42f5a6c858e5403e23b5382000650997292e7e79f1535f5c4d0","error":null,"id":"curl"}
```

As you can see we are getting back a transaction id which we can use later to check up on. A couple of seconds later I received a notification on my software wallet that my funds were received:

![](https://user-images.githubusercontent.com/567298/116690769-2aae2880-a9ba-11eb-8735-3fd1f0cc9ece.png)

First, using our software wallet's address we can look it up:
- https://digiexplorer.info/address/DTqHG9KA3oQAywq18gpBknxHXHZviyYdvS

And it should look like this:

![](https://user-images.githubusercontent.com/567298/116691497-29313000-a9bb-11eb-962d-0427a560718a.png)

We can also lookup the transaction id:
- https://digiexplorer.info/tx/260e49b72f17f42f5a6c858e5403e23b5382000650997292e7e79f1535f5c4d0

And it should look like this:

![](https://user-images.githubusercontent.com/567298/116691773-9ba21000-a9bb-11eb-978e-58be3a8be045.png)

## Resources

RPC Docs:
- https://developer.bitcoin.org/reference/rpc/index.html
- https://chainquery.com/bitcoin-cli

Digibyte Config:
- https://github.com/digibyte/digibyte/blob/master/contrib/debian/examples/digibyte.conf

REST Config:
- https://github.com/digibyte/digibyte/blob/master/doc/REST-interface.md

Resources:
- https://digibytewallets.com/

