---
layout: post
title: "Use the Reindex API on Elasticsearch to Reindex your Data"
date: 2017-11-22 09:32:00 -0500
comments: true
categories: ["elasticsearch", "reindex"] 
---

A Basic Example of Reindexing Data with the `/_reindex` API on Elasticsearch:

## Provision Elasticsearch with Docker:

I will be using Elasticsearch on Docker for this Example:

```bash
$ docker run -itd --name elasticsearch --publish 9200:9200 elasticsearch:alpine
```

## Create Indexes:

Create 3 Indexes and POST 2 Documents to each Index:

```bash
$ curl -XPUT http://127.0.0.1:9200/animals-2017.11.20
$ curl -XPUT http://127.0.0.1:9200/animals-2017.11.21
$ curl -XPUT http://127.0.0.1:9200/animals-2017.11.21
```

Create the Index where we will reindex the data to:

```bash
$ curl -XPUT http://127.0.0.1:9200/animals-2017.11 -d '{"settings": {"number_of_shards": 5, "number_of_replicas": 0}}'
```

POST 2 documents to each index:

```bash
$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.20/name/ -d '{"name": "max", "type": "labrador"}'
$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.20/name/ -d '{"name": "sam", "type": "pooch"}'

$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.21/name/ -d '{"name": "doggie", "type": "bulldog"}'
$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.21/name/ -d '{"name": "james", "type": "huskey"}'

$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.22/name/ -d '{"name": "sarah", "type": "poodle"}'
$ curl -XPOST http://127.0.0.1:9200/animals-2017.11.22/name/ -d '{"name": "frank", "type": "alsation"}'
```

## View the Indexes:

As you can see we have 2 documents per index, and a empty index for the data that we would like to reindex to:

```bash
$ curl -XGET http://127.0.0.1:9200/_cat/indices?v
health status index               uuid                     pri rep docs.count docs.deleted store.size pri.store.size
yellow open   animals-2017.11.20  AxRYUfNpQ5ev2mdZf0bYrw   5   1          2            0      8.9kb          8.9kb
green  open   animals-2017.11     1T6TkYWwRuerIZ5_np1B0w   5   0          0            0      1.5kb          1.5kb
yellow open   animals-2017.11.22  fCdaRyBZRiWyQ3tZLhdBrw   5   1          2            0      8.9kb          8.9kb
yellow open   animals-2017.11.21  4Ei9zMDITHy1dI8lIzfjjA   5   1          2            0      8.9kb          8.9kb
```

## Reindex the Data to our Monthly Index:

We will define our query to match all the indexes that has the data and reindex to our new index `animals-2017.11`:

```bash
$ curl -XPOST http://127.0.0.1:9200/_reindex -d '{"source": {"index": "animals-2017.11.*"}, "dest": {"index": "animals-2017.11"} }'
{"took":219,"timed_out":false,"total":6,"updated":0,"created":6,"deleted":0,"batches":1,"version_conflicts":0,"noops":0,"retries":{"bulk":0,"search":0},"throttled_millis":0,"requests_per_second":-1.0,"throttled_until_millis":0,"failures":[]}
```

## View the Indexes:

```bash
$ curl -XGET http://127.0.0.1:9200/_cat/indices?v
health status index               uuid                     pri rep docs.count docs.deleted store.size pri.store.size
yellow open   animals-2017.11.20  AxRYUfNpQ5ev2mdZf0bYrw   5   1          2            0      8.9kb          8.9kb
green  open   animals-2017.11     1T6TkYWwRuerIZ5_np1B0w   5   0          6            0     20.2kb         20.2kb
yellow open   animals-2017.11.22  fCdaRyBZRiWyQ3tZLhdBrw   5   1          2            0      8.9kb          8.9kb
yellow open   animals-2017.11.21  4Ei9zMDITHy1dI8lIzfjjA   5   1          2            0      8.9kb          8.9kb
```

## Delete the Old Indexes:

As your data is now reindexed, we can safely remove our old indexes:

```bash
$ curl -XDELETE 'http://127.0.0.1:9200/animals-2017.11.*'
```

To verify:

```bash
$ curl -XGET http://127.0.0.1:9200/_cat/indices?v
health status index               uuid                     pri rep docs.count docs.deleted store.size pri.store.size
green  open   animals-2017.11     1T6TkYWwRuerIZ5_np1B0w   5   0          6            0     20.2kb         20.2kb
```

## Resources:

- https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html 
