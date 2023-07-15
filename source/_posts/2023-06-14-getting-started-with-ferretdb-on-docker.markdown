---
layout: post
title: "Getting Started with FerretDB on Docker"
date: 2023-06-14 22:00:00 -0400
comments: true
categories: ["ferretdb", "mongodb", "docker", "databases", "nosql"]
---

In this post we will have a look at **FerretDB** which is a opensource proxy that translates MongoDB queries to SQL, where PostgreSQL being the database engine. 

## More about FerretDB

From [FerretDB](https://www.ferretdb.io/) website, they describe FerretDB as:

"Initially built as open-source software, MongoDB was a game-changer for many developers, enabling them to build fast and robust applications. Its ease of use and extensive documentation made it a top choice for many developers looking for an open-source database. However, all this changed when they switched to an SSPL license, moving away from their open-source roots."

"In light of this, FerretDB was founded to become the true open-source alternative to MongoDB, making it the go-to choice for most MongoDB users looking for an open-source alternative to MongoDB. With FerretDB, users can run the same MongoDB protocol queries without needing to learn a new language or command."

## What can you expect from this tutorial

We will be doing the following:

- deploying ferretdb and postgres on docker containers using docker compose
- then use `mongosh` as a client to logon to ferretdb using the ferretdb endpoint
- explore some example queries to insert and read data from ferretdb
- use scripting to generate data into ferretedb
- explore the embedded prometheus endpoint for metrics

## Deploy FerretDB

The following `docker-compose.yaml` defines a postgres container which will be used as the database engine for ferretdb, and then we define the ferretdb container, which connects to postgres via the environment variable `FERRETDB_POSTGRESQL_URL`.


