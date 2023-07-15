---
layout: post
title: "Getting Started with FerretDB on Docker"
date: 2023-07-14 22:00:00 -0400
comments: true
categories: ["ferretdb", "mongodb", "docker", "databases", "nosql"]
---

In this post we will have a look at **FerretDB** which is a opensource proxy that translates MongoDB queries to SQL, where PostgreSQL being the database engine. 

## More about FerretDB

From [FerretDB](https://www.ferretdb.io/)'s website, they describe FerretDB as:

> Initially built as open-source software, MongoDB was a game-changer for many developers, enabling them to build fast and robust applications. Its ease of use and extensive documentation made it a top choice for many developers looking for an open-source database. However, all this changed when they switched to an SSPL license, moving away from their open-source roots.

> In light of this, FerretDB was founded to become the true open-source alternative to MongoDB, making it the go-to choice for most MongoDB users looking for an open-source alternative to MongoDB. With FerretDB, users can run the same MongoDB protocol queries without needing to learn a new language or command.

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

## Connect to FerretDB

Once the containers started, we can connect to our ferretdb server using mongosh, which is a shell utility to connect to the database). I will make use of a container to do this, where I will reference the network which we defined in our docker compose file, and set the endpoint that mongosh need to connect to:

```bash
docker run --rm -it --network=ferretdb --entrypoint=mongosh mongo:6.0 "mongodb://ferret:password@ferretdb/ferretdb?authMechanism=PLAIN"
```

Once it successfully connects to ferretdb, we should see the following prompt:

```bash
Current Mongosh Log ID:	64626c5c259916d1a68b7dad
Connecting to:		mongodb://<credentials>@ferretdb/ferretdb?authMechanism=PLAIN&directConnection=true&appName=mongosh+1.8.2
Using MongoDB:		6.0.42
Using Mongosh:		1.8.2

ferretdb>
```

## Run example queries on FerretDB


If you are familiar with MongoDB, you will find the following identical to MongoDB. 

First we show the current databases:

```bash
ferretdb> show dbs;
public  0 B
```

The we create and use the database named `mydb`:

```bash
ferretdb> use mydb
switched to db mydb
```

To see which database are we currently connected to:

```bash
mydb> db
mydb
```

Now we can create a collection named `mycol1` and `mycol2`:

```bash
mydb> db.createCollection("mycol1")
{ ok: 1 }
mydb> db.createCollection("mycol2")
{ ok: 1 }
```

We can view our collections by running the following:

```bash
mydb> show collections
mycol1
mycol2
```

To write one document into our collection named `col1` with the following data:

```json
{
  "name": "ruan", 
  "age": 32, 
  "hobbies": [
    "golf", 
    "programming", 
    "music"
  ]
}
```

We can execute:

```bash
mydb> db.mycol1.insertOne({"name": "ruan", "age": 32, "hobbies": ["golf", "programming", "music"]})
{
  acknowledged: true,
  insertedIds: { '0': ObjectId("64626cea259916d1a68b7dae") }
}
```

And we can insert another document:

```bash
mydb> db.mycol1.insertOne({"name": "michelle", "age": 28, "hobbies": ["art", "music", "reading"]})
{
  acknowledged: true,
  insertedIds: { '0': ObjectId("64626cf1259916d1a68b7daf") }
}
```

We can then use `countDocuments()` to view the number of documents in our collection named `mycol1`:

```bash
ferretdb> db.mycol1.countDocuments()
2
```

If we want to find all our documents in our `mycol1` collection:

```bash
mydb> db.mycol1.find()
[
  {
    _id: ObjectId("64626cea259916d1a68b7dae"),
    name: 'ruan',
    age: 32,
    hobbies: [ 'golf', 'programming', 'music' ]
  },
  {
    _id: ObjectId("64626cf1259916d1a68b7daf"),
    name: 'michelle',
    age: 28,
    hobbies: [ 'art', 'music', 'reading' ]
  }
]
```

If we want to only display specific fields in our response, such as name and age, we can project fields to return from our query:

```bash
mydb> db.mycol1.find({}, {"name": 1, "age": 1})
[
  { _id: ObjectId("64626cea259916d1a68b7dae"), name: 'ruan', age: 32 },
  {
    _id: ObjectId("64626cf1259916d1a68b7daf"),
    name: 'michelle',
    age: 28
  }
]
```

We can also suppress the `_id` field by setting the value to `0`:

```bash
mydb> db.mycol1.find({}, {"_id": 0, "name": 1, "age": 1})
[
  { name: 'ruan', age: 32 },
  { name: 'michelle', age: 28 }
]
```

Next we can return all the fields name and age from our collection where the age field is equals to 32:

```bash
mydb> db.mycol1.find({"age": 32}, {"_id": 0, "name": 1, "age": 1})
[ { name: 'ruan', age: 32 } ]
```

We can also find a specific document by its id as example, and return only the field value, like name:

```bash
mydb> db.mycol1.findOne({_id: ObjectId("64626cea259916d1a68b7dae")}).name
ruan
```

Next we will find all documents where the age is greater than 30:

```bash
mydb> db.mycol1.find({"age": {"$gt": 30}})
[
  {
    _id: ObjectId("64626cea259916d1a68b7dae"),
    name: 'ruan',
    age: 32,
    hobbies: [ 'golf', 'programming', 'music' ]
  }
]
```

Let's explore how to insert many documents at once using `insertMany()`, first create a new collection:

```bash
ferretdb> db.createCollection("mycol2")
{ ok: 1 }
```

We can then define the docs variable, and assign a array with 2 json documents:

```bash
ferretdb> var docs = [{name: "peter", age: 34, hobbies: ["ski", "programming", "music"]}, {name: "sam", age: 39, hobbies: ["running", "camping", "music"]}]
```

Now we can insert our documents to ferretdb using `insertMany()`:

```bash
ferretdb> db.mycol2.insertMany(docs)
{
  acknowledged: true,
  insertedIds: {
    '0': ObjectId("6464ceb1413cee26e9bf709f"),
    '1': ObjectId("6464ceb1413cee26e9bf70a0")
  }
}
```

We can count the documents inside our collection using:

```bash
ferretdb> db.mycol2.countDocuments()
2
```

And we can search for all the documents inside the collection:

```bash
ferretdb> db.mycol2.find()
[
  {
    _id: ObjectId("6464ceb1413cee26e9bf709f"),
    name: 'peter',
    age: 34,
    hobbies: [ 'ski', 'programming', 'music' ]
  },
  {
    _id: ObjectId("6464ceb1413cee26e9bf70a0"),
    name: 'sam',
    age: 39,
    hobbies: [ 'running', 'camping', 'music' ]
  }
]
```

And searching for any data using the name `peter`:

```bash
ferretdb> db.mycol2.find({name: "peter"})
[
  {
    _id: ObjectId("6464ceb1413cee26e9bf709f"),
    name: 'peter',
    age: 34,
    hobbies: [ 'ski', 'programming', 'music' ]
  }
]
```

