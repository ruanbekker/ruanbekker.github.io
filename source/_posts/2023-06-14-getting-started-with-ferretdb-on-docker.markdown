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


```yaml
version: "3.9"

services:
  postgres:
    image: postgres:14.8-bullseye
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=ferret
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ferretdb
    volumes:
      - pgvol:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready", "-d", "db_prod"]
      interval: 30s
      timeout: 15s
      retries: 5
      start_period: 60s
    networks:
      - ferretdb
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
        max-file: "1"

  ferretdb:
    image: ghcr.io/ferretdb/ferretdb:1.1.0
    container_name: ferretdb
    restart: unless-stopped
    ports:
      - 27017:27017
      - 8080:8080
    environment:
      - FERRETDB_POSTGRESQL_URL=postgres://postgres:5432/ferretdb
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ferretdb
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
        max-file: "1"

networks:
  ferretdb:
    name: ferretdb

volumes:
  pgvol: {}
```

Once you have the content above saved in `docker-compose.yaml` you can run the following to run the containers in a detached mode:

```bash
docker-compose up -d
```

