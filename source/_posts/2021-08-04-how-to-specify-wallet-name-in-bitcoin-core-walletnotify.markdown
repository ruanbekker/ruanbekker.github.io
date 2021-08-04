---
layout: post
title: "How to specify wallet name in Bitcoin Core walletnotify"
date: 2021-08-04 09:41:51 -0400
comments: true
categories: ["bitcoin", "blockchain", "cryptocurrency"]
---

![](https://blog.ruanbekker.com/images/ruanbekker-header-photo.png)

With bitcoin-core, you get a configuration option called `walletnotify` which allow you to invoke a command whenever you receive a payment, first confirmation of a payment or send a payment.

You can specify `%s` as an argument which will be used to parse the transaction id. 

## Bitcoind WalletNotify TransactionID Example

To see what walletnotify does, in my `bitcoin.conf` I had a basic script to write a entry every time I receive a payment:

```
$ cat ~/.bitcoin/bitcoin.conf
...
walletnotify=/bin/notify.sh %s %w
```

And in my `/bin/notify.sh` script I have this:

```
#!/usr/bin/env bash
transaction_id=$1

# writing to log
echo "[$(date +%FT%T)] event for txid $transaction_id" >> /var/log/bitcoin-notify.log
```

I have executable permissions for the script:

```
$ chmod +x /bin/notify.sh
```

When a payment was made, my logfile showed the following:

```
[2021-08-04T12:21:43] event for txid xxxxxx5d92f729ed77xxxxxx2cbccedxxxxa7a03a801xxxxxxx33a41c1xxxxxd2 
```

## Capturing the wallet name in walletnotify

In bitcoin-core we wave wallets, and in a wallet we have one or more bitcoin addresses, as can be seen below for wallets:

```
$ curl -s -u "bitcoin:${bpass}" -d '{"jsonrpc": "1.0", "id": "curl", "method": "listwallets", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:18332/
{"result":["rpi01-main", "rpi01-secondary"],"error":null,"id":"curl"}
```

and to get the addresses for that wallet:

```
$ curl -s -u "bitcoin:${bpass}" -d '{"jsonrpc": "1.0", "id": "curl", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:18332/wallet/rpi01-main
{"result":{"txxxxxmefmcpq98xxxxxxx80gvug2fe97xxxxxx8yv":{"purpose":"receive"}},"error":null,"id":"curl"}
```

I had to figure out how to capture the wallet name as well as the transaction id, as I thought its not possible until I stumbled upon a post which mentioned from bitcoind 0.20:

> The -walletnotify configuration parameter will now replace any %w in its argument with the name of the wallet generating the notification.

Which was merged by this PR:
- https://github.com/bitcoin/bitcoin/pull/13339

So first to verify that bitcoind is newer than mentioned:

```bash
$ /usr/local/bin/bitcoind -version
Bitcoin Core version v0.21.1
```

Updated the `walletnotify` config in `bitcoin.conf` to include `%w`:

```bash
$ cat /home/bitcoin/.bitcoin/bitcoin.conf | grep wallet
walletnotify=/bin/notify.sh %s %w
```

Then in the `notify.sh` script:

```bash
#!/usr/bin/env bash
transaction_id=$1
wallet_name=$2

echo "[$(date +%FT%T)] $transaction_id $wallet_name" >> /var/log/bitcoin-notify.log
```

And then restart bitcoind:

```
$ sudo systemctl restart bitcoind
```

When a transaction occurred, I could see the transaction id with the corresponding wallet name:

```
$ tail -f /var/log/bitcoin-notify.log
[2021-08-04T12:31:20] fxxxxxxxxxxxxxxxxxxxxxxx2cbcced28ea26fhkxxxxhjn01f33a41c12f8xxx8 rpi01-main
```

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
