---
layout: post
title: "Using Elasticdump to Backup Elasticsearch Indexes to JSON"
date: 2017-11-22 08:35:28 -0500
comments: true
categories: ["elasticsearch", "elasticdump", "nodejs", "backup", "restore", "json"] 
---

We will use Elasticdump to dump data from Elasticsearch to json files on disk, then delete the index, then restore data back to elasticsearch

<a href="https://github.com/ruanbekker/cheatsheets" target="_blank"><img alt="ruanbekker-cheatsheets" src="https://user-images.githubusercontent.com/567298/169162832-ef3019de-bc49-4d6c-b2a6-8ac17c457d24.png"></a>

## Install Elasticdump:

```bash
$ docker run -it node:alpine sh
$ npm install elasticdump -g
```

## Create a Index:

```bash
$ curl -XPUT http://10.79.2.193:9200/test-index
{"acknowledged":true}
```

Ingest Some Data into the Index:

```bash
$ curl -XPUT http://10.79.2.193:9200/test-index/docs/doc1 -d '{"name": "ruan", "age": 30}'
{"_index":"test-index","_type":"docs","_id":"doc1","_version":1,"_shards":{"total":2,"successful":1,"failed":0},"created":true}

$ curl -XPUT http://10.79.2.193:9200/test-index/docs/doc2 -d '{"name": "stefan", "age": 29}'
{"_index":"test-index","_type":"docs","_id":"doc2","_version":1,"_shards":{"total":2,"successful":1,"failed":0},"created":true}
```

## Elasticdump to dump the ata

First dump the mappings:

```bash
$ elasticdump --input=http://10.79.2.193:9200/test-index --output=/opt/backup/elasticsearch/es_test-index_mapping.json --type=mapping
Mon, 26 Jun 2017 14:15:34 GMT | starting dump
Mon, 26 Jun 2017 14:15:34 GMT | got 1 objects from source elasticsearch (offset: 0)
Mon, 26 Jun 2017 14:15:34 GMT | sent 1 objects to destination file, wrote 1
Mon, 26 Jun 2017 14:15:34 GMT | got 0 objects from source elasticsearch (offset: 1)
Mon, 26 Jun 2017 14:15:34 GMT | Total Writes: 1
Mon, 26 Jun 2017 14:15:34 GMT | dump complete
```

Then dump the data:

```bash
$ elasticdump --input=http://10.79.2.193:9200/test-index --output=/opt/backup/elasticsearch/es_test-index.json --type=data
Mon, 26 Jun 2017 14:15:43 GMT | starting dump
Mon, 26 Jun 2017 14:15:43 GMT | got 2 objects from source elasticsearch (offset: 0)
Mon, 26 Jun 2017 14:15:43 GMT | sent 2 objects to destination file, wrote 2
Mon, 26 Jun 2017 14:15:43 GMT | got 0 objects from source elasticsearch (offset: 2)
Mon, 26 Jun 2017 14:15:43 GMT | Total Writes: 2
Mon, 26 Jun 2017 14:15:43 GMT | dump complete
```

Preview the Metadata

```bash
$ cat /opt/backup/elasticsearch/es_test-index_mapping.json | python -m json.tool
{
    "test-index": {
        "mappings": {
            "docs": {
                "properties": {
                    "age": {
                        "type": "long"
                    },
                    "name": {
                        "type": "string"
                    }
                }
            }
        }
    }
}
```

Preview the Data

```bash
$ cat /opt/backup/elasticsearch/es_test-index.json | jq
{
  "_index": "test-index",
  "_type": "docs",
  "_id": "doc1",
  "_score": 1,
  "_source": {
    "name": "ruan",
    "age": 30
  }
}
{
  "_index": "test-index",
  "_type": "docs",
  "_id": "doc2",
  "_score": 1,
  "_source": {
    "name": "stefan",
    "age": 29
  }
}
```

## Restore The Data

Let's test the restoring part, go ahead and delete The index:

```bash
$ curl -XDELETE http://10.79.2.193:9200/test-index
{"acknowledged":true}
```

Restore the Index by Importing the Mapping:

```bash
$ elasticdump --input=/opt/backup/elasticsearch/es_test-index_mapping.json --output=http://10.79.2.193:9200/test-index --type=mapping
Mon, 26 Jun 2017 14:51:48 GMT | starting dump
Mon, 26 Jun 2017 14:51:48 GMT | got 1 objects from source file (offset: 0)
Mon, 26 Jun 2017 14:51:48 GMT | sent 1 objects to destination elasticsearch, wrote 1
Mon, 26 Jun 2017 14:51:48 GMT | got 0 objects from source file (offset: 1)
Mon, 26 Jun 2017 14:51:48 GMT | Total Writes: 1
Mon, 26 Jun 2017 14:51:48 GMT | dump complete
```

Verify to see if the Index Exist:

```bash
$ curl -s -XGET http://10.79.2.193:9200/_cat/indices?v | grep -E '(docs.count|test)'
health status index                     pri rep docs.count docs.deleted store.size pri.store.size
yellow open   test-index                  5   1          0            0       650b           650b
```

## Restore the Data for the Index:

Use elasticdump to restore the data from json to elasticsearch:

```bash
$ elasticdump --input=/opt/backup/elasticsearch/es_test-index.json --output=http://10.79.2.193:9200/test-index --type=data
Mon, 26 Jun 2017 14:53:56 GMT | starting dump
Mon, 26 Jun 2017 14:53:56 GMT | got 2 objects from source file (offset: 0)
Mon, 26 Jun 2017 14:53:56 GMT | sent 2 objects to destination elasticsearch, wrote 2
Mon, 26 Jun 2017 14:53:56 GMT | got 0 objects from source file (offset: 2)
Mon, 26 Jun 2017 14:53:56 GMT | Total Writes: 2
Mon, 26 Jun 2017 14:53:56 GMT | dump complete
```

Verify to see if the Documents was Ingested:

```bash
$ curl -s -XGET http://10.79.2.193:9200/_cat/indices?v | grep -E '(docs.count|test)'
health status index                     pri rep docs.count docs.deleted store.size pri.store.size
yellow open   test-index                  5   1          2            0       650b           650b
```

Preview the Data from Elasticsearch:

```bash
$ curl -s -XGET http://10.79.2.193:9200/test-index/_search?pretty

{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 2,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "test-index",
      "_type" : "docs",
      "_id" : "doc1",
      "_score" : 1.0,
      "_source" : {
        "name" : "ruan",
        "age" : 30
      }
    }, {
      "_index" : "test-index",
      "_type" : "docs",
      "_id" : "doc2",
      "_score" : 1.0,
      "_source" : {
        "name" : "stefan",
        "age" : 29
      }
    } ]
  }
}
```

## Resources:

- https://www.npmjs.com/package/elasticdump

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>
