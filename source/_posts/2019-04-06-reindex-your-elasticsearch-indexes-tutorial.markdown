---
layout: post
title: "Reindex your Elasticsearch Indexes Tutorial"
date: 2019-04-06 15:37:18 -0400
comments: true
categories: ["elasticsearch", "elasticsearch-tutorial", "sysadmin"] 
---

![](https://user-images.githubusercontent.com/567298/53352581-b3892f80-392b-11e9-9532-5db5cbfc8f1c.jpg)

At times you may find that the indexes in your cluster are not queried that often but you still want them around. But you also want to reduce the resource footprint by reducing the number of shards, and perhaps increase the refresh interval.

For refresh interval, if new data comes in and we dont care to have it available near real time, we can set the refresh interval for example to 60 seconds, so the index will only have the data available every 60 seconds. (default: 1s)

## Reindexing Elasticsearch Indexes

In this example we will use the scenario where we have daily indexes with 5 primary shards and 1 set of replicas and we would like to create a weekly index with 1 primary shard, 1 replica and the refresh interval of 60 seconds, and reindex the previous weeks data into our weekly index.

Create the target weekly index with the mentioned configuration:

```
$ curl -H "Content-Type: application/json" -XPUT 'http://127.0.0.1:9200/my-index-2019.01.01-07' -d '
{
	"settings": {
		"number_of_shards": "1",
		"number_of_replicas": "1",
		"refresh_interval" : "60s"
	}
}
'
```

Ensure the index exist:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_cat/indices/my-index-2019.01.01*?v'
health status index                    uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   my-index-2019.01.01      wbFEJCApSpSlbOXzb1Tjxw   5   1      22007            0      6.6mb          3.2mb
green  open   my-index-2019.01.02      cbDmJR7pbpRT3O2x46fj20   5   1      28031            0      7.2mb          3.4mb
..
green  open   my-index-2019.01.01-07   mJR7pJ9O4T3O9jzyI943ca   1   1          0            0       466b           233b
```

Create the reindex job, specify the source indexes and the destination index where the data must be reindexed to:

```
$ curl -s -H 'Content-Type: application/json' -XPOST 'http://127.0.0.1:9200/_reindex' -d '
{
	"source": {
		"index": [
			"my-index-2019.01.01",
			"my-index-2019.01.02",
			"my-index-2019.01.03",
			"my-index-2019.01.04",
			"my-index-2019.01.05",
			"my-index-2019.01.06",
			"my-index-2019.01.07"
		]
	},
	"dest": {
		"index": "my-index-2019.01.01-07"
	}
}
'
```

You can use the tasks api to monitor the progress:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_cat/tasks?'
indices:data/write/bulk        -3MIFskURPKxd1tg8P2j0w:912621270 -                                transport 1538459598188 22:53:18 3.1ms       x.x.x.x -3MIFsk
indices:data/write/bulk[s]     -3MIFskURPKxd1tg8P2j0w:912621271 -3MIFskURPKxd1tg8P2j0w:816648230 transport 1538459598188 22:53:18 3.1ms       x.x.x.x -3MIFsk
```

You manipulate the output of the tasks api by either fetching specific actions:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_tasks?actions=*data/write/reindex&detailed&pretty'
```

Or viewing detailed output:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_cat/tasks?detailed' | grep 'indices:data/write/reindex'
indices:data/write/reindex     IvoqWoUqSgGCQ0ELG21nhg:740560815 -                                transport 1538462294714 23:38:14 1.7m        x.x.x.x IvoqWoU reindex from [my-index-2019.01.01] to [my-index-2019.01.01-07]
```

Or you could get the json response:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_tasks?actions=*data/write/reindex&detailed&pretty'
{
  "nodes" : {
    "xx" : {
      "name" : "xx",
      "roles" : [ "data", "ingest" ],
      "tasks" : {
        "xx:876452606" : {
          "node" : "xx",
          "id" : 776452606,
          "type" : "transport",
          "action" : "indices:data/write/reindex",
          "status" : {
            "total" : 4785475,
            "updated" : 0,
            "created" : 234000,
            "deleted" : 0,
            "batches" : 235,
            "version_conflicts" : 0,
            "noops" : 0,
            "retries" : {
              "bulk" : 0,
              "search" : 0
            },
            "throttled_millis" : 0,
            "requests_per_second" : -1.0,
            "throttled_until_millis" : 0
          },
          "description" : "reindex from [my-index-2019.01.07] to [my-index-2019.01.01-07]",
          "start_time_in_millis" : 1538462901120,
          "running_time_in_nanos" : 64654161339,
          "cancellable" : true
        }
      }
    }
  }
}
```

Anyways, moving along. Reindex jobs will always be listed as a `data/write/reindex` action, so we can count the output:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_cat/tasks?'  | grep 'data/write/reindex' | wc -l
```

If the response is 0 then all the tasks completed and we can have a look at our index again:

```
$ curl -s -XGET 'http://127.0.0.1:9200/_cat/indices/my-index-2019.01.0*?v'
health status index                    uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   my-index-2019.01.01      wbFEJCApSpSlbOXzb1Tjxw   5   1      22007            0      6.6mb          3.2mb
green  open   my-index-2019.01.02      cbDmJR7pbpRT3O2x46fj20   5   1      28031            0      7.2mb          3.4mb
..
green  open   my-index-2019.01.01-07   mJR7pJ9O4T3O9jzyI943ca   1   1     322007            0     45.9mb         22.9mb
```

Now that we can verify that the reindex tasks finished and we can see the aggregated result in our target index, we can delete our source indexes:

```
$ curl -XDELETE 'http://127.0.0.1:9200/my-index-2019.01.01,my-index-2019.01.02,my-index-2019.01.03,my-index-2019.01.04,my-index-2019.01.05,my-index-2019.01.06,my-index-2019.01.07'
```
