---
layout: post
title: "Using the Bulk API with Elasticsearch"
date: 2018-04-29 13:32:21 -0400
comments: true
categories: ["elasticsearch", "bulk"] 
---

This tutorial will guide you how to use the Bulk API with Elasticsearch, this is great for when having a dataset that contains a lot of documents, where you want to insert them into elasticsearch in bulk uploads.

## The Dataset

We will be using a dataset from elastic that contains 1000 documents that holds account data. 

Getting the Dataset:

```bash
$ wget -O accounts.json https://github.com/elastic/elasticsearch/blob/master/docs/src/test/resources/accounts.json?raw=true
```

Preview the data:

```bash
$ head -10  accounts.json
{"index":{"_id":"1"}}
{"account_number":1,"balance":39225,"firstname":"Amber","lastname":"Duke","age":32,"gender":"M","address":"880 Holmes Lane","employer":"Pyrami","email":"amberduke@pyrami.com","city":"Brogan","state":"IL"}
{"index":{"_id":"6"}}
{"account_number":6,"balance":5686,"firstname":"Hattie","lastname":"Bond","age":36,"gender":"M","address":"671 Bristol Street","employer":"Netagy","email":"hattiebond@netagy.com","city":"Dante","state":"TN"}
{"index":{"_id":"13"}}
{"account_number":13,"balance":32838,"firstname":"Nanette","lastname":"Bates","age":28,"gender":"F","address":"789 Madison Street","employer":"Quility","email":"nanettebates@quility.com","city":"Nogal","state":"VA"}
{"index":{"_id":"18"}}
{"account_number":18,"balance":4180,"firstname":"Dale","lastname":"Adams","age":33,"gender":"M","address":"467 Hutchinson Court","employer":"Boink","email":"daleadams@boink.com","city":"Orick","state":"MD"}
{"index":{"_id":"20"}}
{"account_number":20,"balance":16418,"firstname":"Elinor","lastname":"Ratliff","age":36,"gender":"M","address":"282 Kings Place","employer":"Scentric","email":"elinorratliff@scentric.com","city":"Ribera","state":"WA"}

```

## Using the Bulk API:

We will ingest the data to our `bank_accounts` index, and to the `account` type:

```bash
$ curl -s -H "Content-Type: application/json" -XPOST localhost:9200/accounts/docs/_bulk --data-binary "@accounts.json"
```

When it's done, have a look at the indices:

```bash
$ curl http://127.0.0.1:9200/_cat/indices/bank_accounts?v
health status index         uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   bank_accounts BK_OJYOFTD67tqsQBUWSuQ   5   1       1000            0    950.3kb        475.1kb
```

Doing a search and display one document:

```bash
$ curl -XGET 'http://127.0.0.1:9200/bank_accounts/_search?pretty&size=1'
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1000,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "bank_accounts",
        "_type" : "account",
        "_id" : "25",
        "_score" : 1.0,
        "_source" : {
          "account_number" : 25,
          "balance" : 40540,
          "firstname" : "Virginia",
          "lastname" : "Ayala",
          "age" : 39,
          "gender" : "F",
          "address" : "171 Putnam Avenue",
          "employer" : "Filodyne",
          "email" : "virginiaayala@filodyne.com",
          "city" : "Nicholson",
          "state" : "PA"
        }
      }
    ]
  }
}

```

## Demo Recording:

This has also been reccored, which can be viewed here:

- https://asciinema.org/a/BYmZQ0pBiyI8ogVF9t0smczRu

## Using Bulk with Auto Generated ID's

As you might know when you do a POST request to the type, the `_id` field gets auto populated. Timo, one of my friends had the requirement to use the Bulk API to post auto generated Id's and not the static id's that is given in the example dataset.

I have answered this on Elastic's discuss page: https://discuss.elastic.co/t/looking-for-working-example-data-set-to-bulk-index-into-es6/128678/3

I will provide the steps below as well:

```python convert.py 
#!/usr/bin/env python

src_file = 'src_file.json'
dest_file = 'dest_file.json'
metadata = '{"index": {"_index": "bank_accounts", "_type": "account"}}'

with open(src_file) as open_file:
    lines = open_file.readlines()

lines = [line.replace(' ', '') for line in lines]

with open(dest_file, 'w') as f:
    for each_line in lines:
        f.write(metadata + '\n')
        f.writelines(each_line)
``` 

The original file:

```bash
$ head -4 file.json 
{"index":{"_id":"1"}}
{"account_number":1,"balance":39225,"firstname":"Amber","lastname":"Duke","age":32,"gender":"M","address":"880 Holmes Lane","employer":"Pyrami","email":"amberduke@pyrami.com","city":"Brogan","state":"IL"}
{"index":{"_id":"6"}}
{"account_number":6,"balance":5686,"firstname":"Hattie","lastname":"Bond","age":36,"gender":"M","address":"671 Bristol Street","employer":"Netagy","email":"hattiebond@netagy.com","city":"Dante","state":"TN"}
```

Removing the initial metadata:

```bash
$ cat file.json | grep account_number >> src_file.json
$ ./convert.py 
```

Previewing the destination file:

```bash
$ head -4 dest_file.json 
{"index": {"_index": "bank_accounts", "_type": "account"}}
{"account_number":1,"balance":39225,"firstname":"Amber","lastname":"Duke","age":32,"gender":"M","address":"880HolmesLane","employer":"Pyrami","email":"amberduke@pyrami.com","city":"Brogan","state":"IL"}
{"index": {"_index": "bank_accounts", "_type": "account"}}
{"account_number":6,"balance":5686,"firstname":"Hattie","lastname":"Bond","age":36,"gender":"M","address":"671BristolStreet","employer":"Netagy","email":"hattiebond@netagy.com","city":"Dante","state":"TN"}
```

Looking at my current indices:

```bash
$ curl http://localhost:9200/_cat/indices?v
health status index                       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .monitoring-es-6-2018.05.06 3OgdIbDWQWCR8WJlQTXr9Q   1   1     114715            6      104mb           50mb
```

Ingesting the data via Bulk API:

```bash
$ curl -s -H 'Content-Type: application/json' -XPOST localhost:9200/_bulk --data-binary @dest_file.json 
```

Looking at my indices to verify that the index exist:

```bash
$ curl http://localhost:9200/_cat/indices?v
health status index                       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   bank_accounts               u37MQvzhSPe97BJzp1u49Q   5   1       1000            0    296.4kb           690b
green  open   .monitoring-es-6-2018.05.06 3OgdIbDWQWCR8WJlQTXr9Q   1   1     114750            6    103.9mb         49.9mb
```

Looking at one document: :smiley:

```bash
$ curl 'http://localhost:9200/bank_accounts/_search?pretty&size=1'
{
  "took" : 641,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1000,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "bank_accounts",
        "_type" : "account",
        "_id" : "cohJN2MBCa89A-FEmiJs",
        "_score" : 1.0,
        "_source" : {
          "account_number" : 6,
          "balance" : 5686,
          "firstname" : "Hattie",
          "lastname" : "Bond",
          "age" : 36,
          "gender" : "M",
          "address" : "671BristolStreet",
          "employer" : "Netagy",
          "email" : "hattiebond@netagy.com",
          "city" : "Dante",
          "state" : "TN"
        }
      }
    ]
  }
}
```
## Resources:

- https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
