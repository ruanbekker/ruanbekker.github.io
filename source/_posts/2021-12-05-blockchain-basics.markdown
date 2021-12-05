---
layout: post
title: "Blockchain Basics"
date: 2021-12-05 08:12:10 -0500
comments: true
categories: ["blockchain", "bitcoin"]
---

In this tutorial, we will cover the **basics of blockchain** and why you would want to run a full-node such as bitcoin, ethereum, etc.

## Blockchain Basics

Before we start setting up our bitcoin full-node, we first need to get through some blockchain basics, if you already aware of it, you can skip the the setup section of this post.

## Block

Transaction data is **permanently recorded** into files called **blocks**. You can think of it as a **transaction ledger**. Blocks are organised into a linear sequence over time.

New transactions are **constantly being processed** by **miners** into new blocks which are added to the **end of the chain**. As blocks are buried deeper and deeper into the blockchain they **become harder** and harder to change or remove, this gives rise of **[Bitcoin's Irreversible Transactions](https://en.bitcoin.it/wiki/Irreversible_Transactions)**.

The first block added to the blockchain is referred to as the **[genesis block](https://en.bitcoin.it/wiki/Genesis_block)**

## Blockchain

A blockchain is a transaction database shared by **all nodes participating** in a system based on the bitcoin protocol. A **full copy** of a currency's blockchain contains **every** transaction ever executed in the currency. With this information, one can find out how much value belonged to each address at any point in history.

Every block contains a hash of the previous block. This has the effect of creating a chain of blocks from the genesis block to the current block. **Each block** is guaranteed to come after the **previous block** chronologically because the previous block's hash would otherwise not be known. Each block is also computationally impractical to modify once it has been in the chain for a while because every block after it would also have to be regenerated. **These properties are what make bitcoins transactions irreversible**. The blockchain is the main innovation of Bitcoin.

## Mining

Mining is the **process** of **adding transaction records** to bitcoin's public ledger of past transactions. The term "mining rig" is referred to where as a single computer system that performs the necessary computations for "mining".

The blockchain serves to confirm transactions to the rest of the network as having taken place. Bitcoin nodes use the blockchain to **distinguish legitimate Bitcoin transactions** from attempts to re-spend coins that have already been spent elsewhere.

## Node

Any **computer** that connects to the **bitcoin network** is called a **node**. Nodes that fully verify all of the rules of bitcoin are called full nodes. The most popular software implementation of full nodes is called bitcoin-core, its releases can be found on their **[github page](https://github.com/bitcoin/bitcoin/releases)**

## What is a Full Node

A full node is a node (computer system with bitcoin-core running on it) which **downloads every block and transaction** and check them against **bitcoin's consensus rules**. which fully validates transactions and blocks. Almost all full nodes also help the network by accepting transactions and blocks from other full nodes, validating those transactions and blocks, and then relaying them to further full nodes.

Some **examples** of **consensus rules**:

* Blocks may only [create](https://en.bitcoin.it/wiki/Controlled_supply) a certain number of bitcoins. (Currently 6.25 BTC per block.)
* Transactions must have correct signatures for the bitcoins being spent.
* Transactions/blocks must be in the correct data format.
* Within a single [blockchain](https://en.bitcoin.it/wiki/Block_chain), a transaction output cannot be double-spent.

At minimum, a full node must download every transaction that has ever taken place, all new transactions, and all block headers. Additionally, full nodes must store information about every unspent transaction output until it is spent.

By default full nodes are inefficient in that they download each new transaction at least twice, and they store the entire block chain (more than 165 GB as of 20180214) forever, even though only the unspent transaction outputs (<2 GB) are required. Performance can improved by enabling [-blocksonly](https://bitcointalk.org/index.php?topic=1377345.0) mode and enabling [pruning](https://bitcoin.org/en/release/v0.12.0#wallet-pruning)

## Archival Nodes

A subset of full nodes also **accept incoming connections** and **upload old blocks** to other peers on the network. This happens if the software is run with -listen=1 as is default.

Contrary to some popular misconceptions, being an archival node is not necessary to being a full node. If a user's bandwidth is constrained then they can use -listen=0, if their disk space is constrained they can use pruning, all the while still being a fully-validating node that enforces bitcoin's consensus rules and contributing to bitcoin's overall security.

Most information was referenced from **[this](https://en.bitcoin.it/wiki/Full_node)** wiki.

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.


