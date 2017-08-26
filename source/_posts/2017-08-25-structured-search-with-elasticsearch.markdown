---
layout: post
title: "Structured Search with Elasticsearch"
date: 2017-08-25 23:42:19 -0400
comments: true
categories: ["elasticsearch"]
---

[Structured Search](https://www.elastic.co/guide/en/elasticsearch/guide/current/structured-search.html) with Elasticsearch:

![](https://dl.dropboxusercontent.com/u/31991539/images/sysadmins/elasticsearch-logo.png)


In this post we will ingest some dummy data into elasticsearch, then we will perform some queries to get the following info:

- Student Names
- Student Ages
- Include / Exclude
- Marks greater than
- Finding Students with Specific marks, etc.


## Create the Mapping for our Index:

for our Data as we wont use the [Dynamic Mapping](https://www.elastic.co/guide/en/elasticsearch/guide/current/dynamic-mapping.html) that comes with by default:

```
$ curl -XPUT http://127.0.0.1:9200/school -d '
{
  "mappings": {
    "students": {
      "properties": {
        "name": {"type": "string"},
        "marks": {"type": "short"},
        "gender": {"type": "string"},
        "age": {"type": "short"}
      }
    }
  }
}'
```

## Ingesting the Data into Elasticsearch:

You can either using the following:

```
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "james", "marks": 60, "gender": "male", "age": 14} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "simon", "marks": 70, "gender": "male", "age": 15} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "samantha", "marks": 70, "gender": "female", "age": 14} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "john", "marks": 60, "gender": "male", "age": 14} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "michelle", "marks": 30, "gender": "female", "age": 14} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "max", "marks": 75, "gender": "female", "age": 15} '
curl -XPOST http://127.0.0.1:9200/school/students/ -d ' {"name": "frank", "marks": 79, "gender": "male", "age": 15} '
```

or using the Bulk API:

Save the following as `bulk.json`:

```
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYob6VgXGdBeaBa1c" } }
{"name": "james", "marks": 60, "gender": "male", "age": 14}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYqU3VgXGdBeaBa1d" } }
{"name": "simon", "marks": 70, "gender": "male", "age": 15}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYrzFVgXGdBeaBa1v" } }
{"name": "samantha", "marks": 70, "gender": "female", "age": 14}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYtuUVgXGdBeaBa2I" } }
{"name": "john", "marks": 60, "gender": "male", "age": 14}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYvMOVgXGdBeaBa2K" } }
{"name": "michelle", "marks": 30, "gender": "female", "age": 14}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYwwnVgXGdBeaBa2j" } }
{"name": "max", "marks": 75, "gender": "female", "age": 15}
{"index" : {"_index" : "school", "_type" : "students", "_id" : "AV4cYyXYVgXGdBeaBa29" } }
{"name": "frank", "marks": 79, "gender": "male", "age": 15}
```

Then use the Bulk API to Ingest into Elasticsearch:

```
$ curl -s -XPOST http://127.0.0.1:9200/_bulk --data-binary @bulk.json
```

Then you should have 7 documents ingested into Elasticsearch:

```
$ curl -XGET http://10.4.156.13:9200/_cat/indices/school?v
health status index  pri rep docs.count docs.deleted store.size pri.store.size
yellow open   school   5   1          7            0     19.4kb         19.4kb
```

You should notice that I have a yellow state, as this is a single instance where I am running elasticsearch on, so there will be unassigned shards.

## Query Student Names:

Let's search for the Student with the Name `Max`:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '{"query": {"term" : {"name" : "max"}}}'
```
```
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cRqaLVgXGdBeaBaWD",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    } ]
  }
}
```

## Search Student Ages:

Search for all students with the age of `15`:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '{"query": {"term" : {"age" : 15}}}'
```
```
{
  "took" : 14,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cRWPPVgXGdBeaBaVF",
      "_score" : 1.0,
      "_source" : {
        "name" : "simon",
        "marks" : 70,
        "gender" : "male",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cRqaLVgXGdBeaBaWD",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cRxayVgXGdBeaBaWg",
      "_score" : 0.30685282,
      "_source" : {
        "name" : "frank",
        "marks" : 79,
        "gender" : "male",
        "age" : 15
      }
    } ]
  }
}
```

## Query, Include but also Exclude:

Query everyone that is 14, and which is males, except the Student called John:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "bool" : {
              "should" : [
                 { "term" : {"age" : 14}},
                 { "term" : {"gender" : "male"}}
              ],
              "must_not" : {
                 "term" : {"name" : "john"}
              }
           }
         }
      }
   }
}'
```
```
"hits" : {
  "total" : 5,
  "max_score" : 1.0,
  "hits" : [ {
    "_index" : "school",
    "_type" : "students",
    "_id" : "AV4cYob6VgXGdBeaBa1c",
    "_score" : 1.0,
    "_source" : {
      "name" : "james",
      "marks" : 60,
      "gender" : "male",
      "age" : 14
    }
  }, {
    "_index" : "school",
    "_type" : "students",
    "_id" : "AV4cYvMOVgXGdBeaBa2K",
    "_score" : 1.0,
    "_source" : {
      "name" : "michelle",
      "marks" : 30,
      "gender" : "female",
      "age" : 14
    }
  }, {
    "_index" : "school",
    "_type" : "students",
    "_id" : "AV4cYyXYVgXGdBeaBa29",
    "_score" : 1.0,
    "_source" : {
      "name" : "frank",
      "marks" : 79,
      "gender" : "male",
      "age" : 15
    }
  }, {
    "_index" : "school",
    "_type" : "students",
    "_id" : "AV4cYqU3VgXGdBeaBa1d",
    "_score" : 1.0,
    "_source" : {
      "name" : "simon",
      "marks" : 70,
      "gender" : "male",
      "age" : 15
    }
  }, {
    "_index" : "school",
    "_type" : "students",
    "_id" : "AV4cYrzFVgXGdBeaBa1v",
    "_score" : 1.0,
    "_source" : {
      "name" : "samantha",
      "marks" : 70,
      "gender" : "female",
      "age" : 14
    }
  } ]
}
}
```

## Query for Age, Gender with High Grades:

Show me everyone thats 14 years old, including males, but only with scores better than 70 and up

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "bool" : {
              "should" : [
                 { "term" : {"age" : 14}},
                 { "term" : {"gender" : "male"}}
              ],
              "must_not" : {
                 "range" : {"marks": {"lt": 70, "gte": 0}}
              }
           }
         }
      }
   }
}'
```

## Everyone that got 70 and more:

Show me all the students that has marks of 70 and above:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "bool" : {
            "must" : [
              { "range" : {"marks" : {"lt": 100, "gte": 70}}}
            ]
          }
        }              
     }
   }
}'
```
```
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 4,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYwwnVgXGdBeaBa2j",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYyXYVgXGdBeaBa29",
      "_score" : 1.0,
      "_source" : {
        "name" : "frank",
        "marks" : 79,
        "gender" : "male",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYqU3VgXGdBeaBa1d",
      "_score" : 1.0,
      "_source" : {
        "name" : "simon",
        "marks" : 70,
        "gender" : "male",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYrzFVgXGdBeaBa1v",
      "_score" : 1.0,
      "_source" : {
        "name" : "samantha",
        "marks" : 70,
        "gender" : "female",
        "age" : 14
      }
    } ]
  }
}
```

Or you can do it like this:

## Query Range only with `gt`:

Show me everyone that got more than 70:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "bool" : {
              "must" : [
                { "range" : {"marks" : {"gt": 70}}}
            ]
          }
        }              
     }
   }
}'
```
```
{
  "took" : 7,
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
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYwwnVgXGdBeaBa2j",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYyXYVgXGdBeaBa29",
      "_score" : 1.0,
      "_source" : {
        "name" : "frank",
        "marks" : 79,
        "gender" : "male",
        "age" : 15
      }
    } ]
  }
}
```

## Gender Specific, with Grades more than 70:

Show me females that has more than 70:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "bool" : {
            "must" : [
              { "range" : {"marks" : {"lt": 100, "gte": 70}}}
            ],
            "must_not": [
              {"term": {"gender": "male"}}
            ]
          }
        }              
     }
   }
}'
```
```
{
  "took" : 13,
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
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYwwnVgXGdBeaBa2j",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYrzFVgXGdBeaBa1v",
      "_score" : 1.0,
      "_source" : {
        "name" : "samantha",
        "marks" : 70,
        "gender" : "female",
        "age" : 14
      }
    } ]
  }
}
```

## Grade Specific:

Show me the ones that got 30 and 75:

```
$ curl -XGET http://10.4.156.13:9200/school/students/_search?pretty -d '
{
   "query" : {
      "constant_score" : {
         "filter" : {
            "terms" : {
              "marks": [30, 75]
            }
         }
      }
   }
}'
```
```
{
  "took" : 6,
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
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYwwnVgXGdBeaBa2j",
      "_score" : 1.0,
      "_source" : {
        "name" : "max",
        "marks" : 75,
        "gender" : "female",
        "age" : 15
      }
    }, {
      "_index" : "school",
      "_type" : "students",
      "_id" : "AV4cYvMOVgXGdBeaBa2K",
      "_score" : 1.0,
      "_source" : {
        "name" : "michelle",
        "marks" : 30,
        "gender" : "female",
        "age" : 14
      }
    } ]
  }
}
```

For more information on this, have a look at [Elasticsearch: Structured Search](https://www.elastic.co/guide/en/elasticsearch/guide/current/structured-search.html)
