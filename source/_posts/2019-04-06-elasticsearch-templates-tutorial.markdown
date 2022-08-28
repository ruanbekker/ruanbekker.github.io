---
layout: post
title: "Elasticsearch Templates Tutorial"
date: 2019-04-06 15:41:53 -0400
comments: true
categories: ["elasticsearch", "elasticsearch-tutorial", "sysadmin"]
---

![elasticsearch](https://user-images.githubusercontent.com/567298/53352581-b3892f80-392b-11e9-9532-5db5cbfc8f1c.jpg)

Elasticsearch Index templates allow you to define templates that will automatically be applied on index creation time. The templates can include both settings and mappings..

## What are we doing?

We want to create a template on how we would a target index to look like. It should consist of 1 primary shard and 2 replica shards and we want to update the mapping that we can make use of text and keyword string fields.

So then whenever we create an index which matches our template, the template will be applied on index creation. 

## String Fields

We will make use of the following string fields in our mappings which will be included in our templates:

**Text**:

A field to index full-text values, such as the body of an email or the description of a product. These fields are analyzed, that is they are passed through an analyzer to convert the string into a list of individual terms before being indexed. The analysis process allows Elasticsearch to search for individual words within each full text field

**Keyword"**:

A field to index structured content such as email addresses, hostnames, status codes, zip codes or tags.

They are typically used for filtering (Find me all blog posts where status is published), for sorting, and for aggregations. Keyword fields are only searchable by their exact value

## Note about templates:

Couple of things to keep in mind:

```
1. Templates gets referenced on index creation and does not affect existing indexes
2. When you update a template, you need to specify the exact template, the payload overwrites the whole template
```

View your current templates in your cluster:

```
$ curl -XGET http://localhost:9200/_cat/templates?v
name                          index_patterns             order      version
.monitoring-kibana            [.monitoring-kibana-6-*]   0          6020099
filebeat-6.3.1                [filebeat-6.3.1-*]         1
```

Create the template `foobar_docs` which will match any indexes matching `foo-*` and `bar-*` which will inherit index settings of 1 primary shards and 2 replica shards and also apply a mapping template shown below:

```
$ curl -H 'Content-Type: application/json' -XPUT http://localhost:9200/_template/foobar_docs -d '
{
  "index_patterns": [
    "foo-*", "bar-*"
  ], 
  "settings": {
    "number_of_shards": 1, 
    "number_of_replicas": 2
  }, 
  "mappings": {
    "type1": {
      "_source": {"enabled": true}, 
      "properties": {"created_at": {"type": "date"}, 
      "title": {"type": "text"}, 
      "status": {"type": "keyword"}, 
      "content": {"type":"text"}, 
      "first_name": {"type": "keyword"}, 
      "last_name": {"type": "keyword"}, 
      "age": {"type":"integer"}, 
      "registered": {"type": "boolean"}
      }
    }
  }
}'
{"acknowledged":true}
```

View the template from the api:

```
$ curl -XGET http://localhost:9200/_cat/templates/foobar_docs?v
name        index_patterns order version
foobar_docs [foo-*, bar-*] 0
```

Create a index that will match the templates definition:

```
$ curl -H 'Content-Type: application/json' -XPUT http://localhost:9200/test-2018.07.20
{"acknowledged":true,"shards_acknowledged":true,"index":"test-2018.07.20"}
```

Verify that the index has been created:

```
$ curl -XGET http://localhost:9200/_cat/indices/test-2018.07.20?v
health status index           uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   test-2018.07.20 -5XOfl0GTEGeHycTwL51vQ   5   1          0            0        2kb          1.1kb
```

We can also inspect the template like shown below:

```
$ curl -XGET http://localhost:9200/_template/foobar_docs?pretty
{
  "foobar_docs" : {
    "order" : 0,
    "index_patterns" : [
      "foo-*",
      "bar-*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1",
        "number_of_replicas" : "2"
      }
    },
    "mappings" : {
      "type1" : {
        "_source" : {
          "enabled" : true
        },
        "properties" : {
          "created_at" : {
            "type" : "date"
          },
          "title" : {
            "type" : "text"
          },
          "status" : {
            "type" : "keyword"
          },
          "content" : {
            "type" : "text"
          },
          "first_name" : {
            "type" : "keyword"
          },
          "last_name" : {
            "type" : "keyword"
          },
          "age" : {
            "type" : "integer"
          },
          "registered" : {
            "type" : "boolean"
          }
        }
      }
    },
    "aliases" : { }
  }
}
```

Ingest a document to your index:

```
$ curl -H 'Content-Type: application/json' -XPOST http://localhost:9200/foo-2018.07.20/type1/ -d '
{
  "title": "this is a post", 
  "status": "active", 
  "content": "introduction post", 
  "first_name": "ruan", 
  "last_name": "bekker", 
  "age": "31", 
  "registered": "true"
}'
```

Run a search against your elasticsearch index to view the data:

```
$ curl -XGET http://localhost:9200/foo-2018.07.20/_search?pretty
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "ZYfotmQB9mQGWzJT7W2y",
        "_score" : 1.0,
        "_source" : {
          "title" : "this is a post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "ruan",
          "last_name" : "bekker",
          "age" : "31",
          "registered" : "true"
        }
      }
    ]
  }
}
```

Create another document:

```
$ curl -H 'Content-Type: application/json' -XPOST http://localhost:9200/foo-2018.07.20/type1/ -d '
{
  "created_at": 1532077144, 
  "title": "this is a another post", 
  "status": "ae", 
  "content": "introduction post", 
  "first_name": "stefan", 
  "last_name": "bester", 
  "age": 34, 
  "registered": "true"
}'
```

As you guessed, executing another search against elasticsearch shows us both documents:

```
$ curl -XGET http://localhost:9200/foo-2018.07.20/_search?pretty
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 2,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "ZYfotmQB9mQGWzJT7W2y",
        "_score" : 1.0,
        "_source" : {
          "title" : "this is a post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "ruan",
          "last_name" : "bekker",
          "age" : "31",
          "registered" : "true"
        }
      },
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "rofrtmQB9mQGWzJTxnvp",
        "_score" : 1.0,
        "_source" : {
          "created_at" : 1532077144,
          "title" : "this is a another post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "stefan",
          "last_name" : "bester",
          "age" : 34,
          "registered" : "true"
        }
      }
    ]
  }
}
```

Let's run a search query for any documents matching people with the age between **30** and **40**:

```
$ curl -H 'Content-Type: application/json' -XGET http://localhost:9200/foo-2018.07.20/_search?pretty -d '{"query": {"range": {"age": {"gte": 30, "lte": 40}}}}'
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 2,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "ZYfotmQB9mQGWzJT7W2y",
        "_score" : 1.0,
        "_source" : {
          "title" : "this is a post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "ruan",
          "last_name" : "bekker",
          "age" : "31",
          "registered" : "true"
        }
      },
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "rofrtmQB9mQGWzJTxnvp",
        "_score" : 1.0,
        "_source" : {
          "created_at" : 1532077144,
          "title" : "this is a another post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "stefan",
          "last_name" : "bester",
          "age" : 34,
          "registered" : "true"
        }
      }
    ]
  }
}
```

Search for people with the age between **32** and **40**:

```
$ curl -H 'Content-Type: application/json' -XGET http://localhost:9200/foo-2018.07.20/_search?pretty -d '{"query": {"range": {"age": {"gte": 32, "lte": 40}}}}'
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "foo-2018.07.20",
        "_type" : "type1",
        "_id" : "rofrtmQB9mQGWzJTxnvp",
        "_score" : 1.0,
        "_source" : {
          "created_at" : 1532077144,
          "title" : "this is a another post",
          "status" : "active",
          "content" : "introduction post",
          "first_name" : "stefan",
          "last_name" : "bester",
          "age" : 34,
          "registered" : "true"
        }
      }
    ]
  }
}
```

Let's say we want to update our template with `refresh_interval`, primary shards of 2 and replicas of 1 settings:

```
$ curl -H 'Content-Type: application/json' -XPUT http://localhost:9200/_template/foobar_docs -d '
{
  "index_patterns": ["foo-*", "bar-*"], 
  "settings": {"number_of_shards": 2, "number_of_replicas": 1, "refresh_interval": "15s"}
}'
```

View the template, as you can see the target template will look exactly like the data body that we are posting to the template api:

```
$ curl -XGET http://localhost:9200/_template/foobar_docs?pretty
{
  "foobar_docs" : {
    "order" : 0,
    "index_patterns" : [
      "foo-*",
      "bar-*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "2",
        "number_of_replicas" : "1",
        "refresh_interval" : "15s"
      }
    },
    "mappings" : { },
    "aliases" : { }
  }
}
```

View our current index, as you can see the index is unaffected of the template change as only new indexes will retrieve the update of the template:

```
$ curl -XGET http://localhost:9200/_cat/indices/foo-2018.07.20?v
health status index          uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   foo-2018.07.20 ol1pGugrQCKd0xES4R6oFg   1   2          2            0     20.4kb         10.2kb
```

Create a new index to verify that the template's config is pulled into the new index:

```
$ curl -H 'Content-Type: application/json' -XPUT http://localhost:9200/foo-2018.07.20-new
```

View the elasticsearch indexes to verify the behavior:

```
$ curl -XGET http://localhost:9200/_cat/indices/foo-2018.07.*?v
health status index              uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   foo-2018.07.20     ol1pGugrQCKd0xES4R6oFg   1   2          2            0     20.4kb         10.2kb
green  open   foo-2018.07.20-new g6Ii8jtKRFa1zDVB2IsDBQ   2   1          0            0       920b           460b
```

Delete the indexes:

```
$ curl -XDELETE http://localhost:9200/foo-*
{"acknowledged":true}
```

Delete the templates:

```
$ curl -XDELETE 'http://localhost:9200/_template/foobar_docs'
{"acknowledged":true}
```

Verify that the templates are gone:

```
$ curl -XGET http://localhost:9200/_cat/templates/foobar_docs?v
name index_patterns order version
```

## Resources:

https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-templates.html
https://www.elastic.co/guide/en/elasticsearch/reference/6.3/mapping-types.html
https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-range-query.html


