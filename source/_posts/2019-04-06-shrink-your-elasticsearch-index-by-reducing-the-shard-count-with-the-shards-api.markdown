---
layout: post
title: "Shrink your Elasticsearch Index by Reducing the Shard Count with the Shards API"
date: 2019-04-06 15:33:48 -0400
comments: true
categories: ["elasticsearch", "elasticsearch-tutorial", "databases", "sysadmin"] 
---

![elasticsearch](https://user-images.githubusercontent.com/567298/53352581-b3892f80-392b-11e9-9532-5db5cbfc8f1c.jpg)

Resize your Elasticsearch Index with fewer Primary Shards by using the Shrink API.

In Elasticsearch, every index consists of multiple shards and every shard in your elasticsearch cluster contributes to the usage of your cpu, memory, file descriptors etc. This definitely helps for performance in parallel processing. As for an example with time series data, you would write and read a lot to an index with ie the current date.

If that index drops in requests and only read from the index every now and then, we dont need that many shards anymore and if we have multiple indexes, they may build up and take up unessacary compute power.

For a scenario where we want to reduce the size of our indexes, we can use the Shrink API to reduce the number of primary shards.

## The Shrink API

The shrink index API allows you to shrink an existing index into a new index with fewer primary shards. The requested number of primary shards in the target index must be a factor of the number of shards in the source index. For example an index with 8 primary shards can be shrunk into 4, 2 or 1 primary shards or an index with 15 primary shards can be shrunk into 5, 3 or 1. If the number of shards in the index is a prime number it can only be shrunk into a single primary shard. Before shrinking, a (primary or replica) copy of every shard in the index must be present on the same node.

Steps on Shrinking:

Create the target index with the same definition as the source index, but with a smaller number of primary shards.
Then it hard-links segments from the source index into the target index.
Finally, it recovers the target index as though it were a closed index which had just been re-opened.

## Reduce the Primary Shards of an Index.

As you may know, you can only set the Primary Shards on Index Creation time and Replica Shards you can set on the fly.

In this example we have a source index: `my-index-2019.01.10` with 5 primary shards and 1 replica shard, which gives us 10 shards for that index, that we would like to shrink to an index named: `archive_my-index-2019.01.10` with 1 primary shard and 1 replica shard, which will give us 2 shards for that index.

Have a look at your index:

```
$ curl -XGET "http://127.0.0.1:9200/_cat/indices/my-index-2019.01.*?v"
health status index                                     uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   my-index-2019.01.10                       xAijUTSevXirdyTZTN3cuA   5   1   80795533            0      5.9gb          2.9gb
green  open   my-index-2019.01.11                       yb8Cjy9eQwqde8mJhR_vlw   5   5   80590481            0      5.7gb          2.8gb
...
```

And have a look at the nodes, as we will relocate the shards to a specific node:

```
$ curl http://127.0.0.1:9200/_cat/nodes?v
ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
x.x.x.x             8          98   0    0.04    0.03     0.01 m         -      3E9yp60
x.x.x.x            65          99   4    0.43    0.23     0.36 di        -      znFrs18
```

In this demonstration we only have 2 nodes with a replication factor of 1, which means a index's shards will always reside on both nodes. In a case with more nodes, we need to ensure that we choose a node where a primary index reside on.

Look at the shards api, by passing the index name to get the index to shard allocation:

```
$ curl http://127.0.0.1:9200/_cat/shards/my-index-2019.01.10?v'
index               shard prirep state   docs  store ip       node
my-index-2019.01.10 2     p      STARTED  193  101mb x.x.x.x  Lq9P7eP
my-index-2019.01.10 2     r      STARTED  193  101mb x.x.x.x  F5edOwK
my-index-2019.01.10 4     p      STARTED  197  101mb x.x.x.x  Lq9P7eP
my-index-2019.01.10 4     r      STARTED  197  101mb x.x.x.x  F5edOwK
my-index-2019.01.10 3     r      STARTED  184  101mb x.x.x.x  Lq9P7eP
my-index-2019.01.10 3     p      STARTED  184  101mb x.x.x.x  F5edOwK
my-index-2019.01.10 1     r      STARTED  180  101mb x.x.x.x  Lq9P7eP
my-index-2019.01.10 1     p      STARTED  180  101mb x.x.x.x  F5edOwK
my-index-2019.01.10 0     p      STARTED  187  101mb x.x.x.x  Lq9P7eP
my-index-2019.01.10 0     r      STARTED  187  101mb x.x.x.x  F5edOwK
```

Create the target index:

```
$ curl -XPUT -H 'Content-Type: application/json' http://127.0.0.1:9200/archive_my-index-2019.01.10 -d '
{
	"settings": {
		"number_of_shards": "1",
		"number_of_replicas": "1"
	}
}
'
```

Set the index as read only and relocate every copy of shard to node we indentified in a previous step:

```
$ curl -XPUT -H 'Content-Type: application/json' http://127.0.0.1:9200/my-index-2019.01.10/_settings -d '
{
	"settings": {
		"index.routing.allocation.require._name": "Lq9P7eP",
		"index.blocks.write": true
	}
}
'
```

Now shrink the source index (my-index-2019.01.10) to the target index (archive_my-index-2019.01.10):

```
$ curl -XPOST -H 'Content-Type: application/json' http://127.0.0.1:9200/my-index-2019.01.10/_shrink/archive_my-index-2019.01.10
```

You can monitor the progress by using the Recovery API:

```
$ curl -s -XGET "http://127.0.0.1:9200/_cat/recovery/my-index-2019.01.10?human&detailed=true"
my-index-2019.01.10 0 23.3s peer done x.x.x.x  F5edOwK x.x.x.x Lq9P7eP n/a n/a 15 15 100.0% 15 635836677 635836677 100.0% 635836677 0 0 100.0%
my-index-2019.01.10 1 22s   peer done x.x.x.x  Lq9P7eP x.x.x.x Lq9P7eP n/a n/a 15 15 100.0% 15 636392649 636392649 100.0% 636392649 0 0 100.0%
my-index-2019.01.10 2 19.6s peer done x.x.x.x  F5edOwK x.x.x.x Lq9P7eP n/a n/a 15 15 100.0% 15 636809671 636809671 100.0% 636809671 0 0 100.0%
my-index-2019.01.10 3 21.5s peer done x.x.x.x  Lq9P7eP x.x.x.x Lq9P7eP n/a n/a 15 15 100.0% 15 636378870 636378870 100.0% 636378870 0 0 100.0%
my-index-2019.01.10 4 23.3s peer done x.x.x.x F5edOwK- x.x.x.x Lq9P7eP n/a n/a 15 15 100.0% 15 636545756 636545756 100.0% 636545756 0 0 100.0%
```

You can also pass aliases as your table columns for output:

```
$ curl -s -XGET "http://127.0.0.1:9200/_cat/recovery/my-index-2019.01.10?v&detailed=true&h=index,shard,time,ty,st,shost,thost,f,fp,b,bp"
index                            shard time  ty   st   shost         thost        f  fp     b         bp
my-index-2019.01.10              0     23.3s peer done x.x.x.x x.x.x.x 15 100.0% 635836677 100.0%
...
```

When the job is done, have a look at your indexes:

```
$ curl -XGET "http://127.0.0.1:9200/_cat/indices/*my-index-2019.01.10?v"
health status index                                     uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   archive_my-index-2019.01.10               PAijUTSeRvirdyTZTN3cuA   1   1   80795533            0      5.9gb          2.9gb
green  open   my-index-2019.01.10                       Cb8Cjy9CQwqde8mJhR_vlw   5   1   80795533            0      2.9gb          2.9gb
```

Remove the block on your old index in order to make it writable:

```
$ curl -XPUT -H 'Content-Type: application/json' http://127.0.0.1:9200/my-index-2019.01.10/_settings" -d '
{
	"settings": {
		"index.routing.allocation.require._name": null,
		"index.blocks.write": null
	}
}
'
```

Delete the old index:

```
$ curl -XDELETE -H 'Content-Type: application/json' http://127.0.0.1:9200/my-index-2019.01.10
```

Note:, On AWS Elasticsearch Service, if you dont remove the block and you trigger a redeployment, you will end up with something like this. Shard may still be constraint to a node.

```
$ curl -s -XGET ${ES_HOST/_cat/allocation?v
shards disk.indices disk.used disk.avail disk.total disk.percent host          ip  node
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  ap9Mx1R
     1        3.6gb    54.9gb    952.8gb   1007.8gb            5 x.x.x.x  x.x.x.x  PqmoQpN   <-----------
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  5p7x4Lc
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  c8kniP3
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  jPwlwsD
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  ljos4mu
   481      904.1gb   990.3gb    521.3gb      1.4tb           65 x.x.x.x  x.x.x.x  qAF-gIU
   481      820.2gb   903.6gb    608.1gb      1.4tb           59 x.x.x.x  x.x.x.x  dR3sNwA
   481      824.6gb   909.1gb    602.6gb      1.4tb           60 x.x.x.x  x.x.x.x  fvL4A9X
   481      792.7gb   876.5gb    635.2gb      1.4tb           57 x.x.x.x  x.x.x.x  lk4svht
   481      779.2gb   864.4gb    647.3gb      1.4tb           57 x.x.x.x  x.x.x.x  uLsej9m
     0           0b    51.2gb    956.5gb   1007.8gb            5 x.x.x.x  x.x.x.x  yM4Ka9l
```

## Resources:

- https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-shrink-index.html


