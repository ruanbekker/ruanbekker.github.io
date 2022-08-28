---
layout: post
title: "Reindex Elasticsearch Indices with Logstash"
date: 2019-09-08 13:00:59 +0200
comments: true
categories: ["elasticsearch", "logstash"]
---

![logstash](https://user-images.githubusercontent.com/567298/59209960-ca872100-8bac-11e9-8672-8c6af502afe0.png)

In this tutorial I will show you how to reindex daily indices to a monthly index on Elasticsearch using Logstash

## Use Case

In this scenario we have filebeat indices which have a low document count and would like to aggregate the daily indices into a bigger index, which will be a monthly index. So reindexing from `"filebeat-2019.08.*"` to `"filebeat-monthly-2019.08"`.

## Overview of our Setup

Here we can see all the indices that we would like to read from"

```
$ curl 10.37.117.130:9200/_cat/indices/filebeat-2019.08.*?v
health status index               uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   filebeat-2019.08.28 qoKiHUjQT5eNVF_wjLi9fA   5   1         17            0    295.4kb        147.7kb
green  open   filebeat-2019.08.27 8PWngqFdRPKLEnrCCiw6xA   5   1        301            0    900.9kb          424kb
green  open   filebeat-2019.08.29 PiG2ma8zSbSt6sSg7soYPA   5   1         24            0    400.2kb          196kb
green  open   filebeat-2019.08.31 XSWZvqQDR0CugD23y6_iaA   5   1         27            0    451.5kb        222.1kb
green  open   filebeat-2019.08.30 u_Hr9fA5RtOtpabNGUmSpw   5   1         18            0    326.1kb          163kb
```

I have 3 nodes in my elasticsearch cluster:

```
$ curl 10.37.117.130:9200/_cat/nodes?v
ip            heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.37.117.132           56          56   5    0.47    0.87     1.10 mdi       -      elasticsearch-01
10.37.117.130           73          56   4    0.47    0.87     1.10 mdi       -      elasticsearch-03
10.37.117.199           29          56   4    0.47    0.87     1.10 mdi       *      elasticsearch-02
```

As elasticsearch create 5 primary shards by default, I want to override this behavior to creating 3 primary shards. I will be using a template, so whenever a index get created with the index pattern `"*-monthly-*", it will apply the settings to create 3 primary shards and 1 replica shards:

```
$ curl -H 'Content-Type: application/json' -XPUT 10.37.117.130:9200/_template/monthly -d '
{"index_patterns": ["*-monthly-*"], "order": -1, "settings": {"number_of_shards": "3", "number_of_replicas": "1"}}
'
```

## Logstash Configuration

Our logstash configuration which we will use, will read from elasticsearch and the index pattern which we want to read from. Then our ouput configuration instructs where to write the data to:

```
$ cat /tmp/logstash/logstash.conf
input {
  elasticsearch {
    hosts => [ "http://10.37.117.132:9200" ]
    index => "filebeat-2019.08.*"
    size => 500
    scroll => "5m"
    docinfo => true
  }
}

output {
  elasticsearch {
    hosts => ["http://10.37.117.199:9200"]
    index => "filebeat-monthly-2019.08"
    document_id => "%{[@metadata][_id]}"
  }
  stdout {
    codec => "dots"
  }
}
```

## Reindex the Data

I will be using docker to run logstash, and map the configuration to the configuration directory inside the container:

```
$ sudo docker run --rm -it -v /tmp/logstash:/usr/share/logstash/pipeline docker.elastic.co/logstash/logstash-oss:6.2.4
[2019-09-08T10:57:36,170][INFO ][logstash.pipeline        ] Pipeline started successfully {:pipeline_id=>"main", :thread=>"#<Thread:0x7db57d5f run>"}
[2019-09-08T10:57:36,325][INFO ][logstash.agent           ] Pipelines running {:count=>1, :pipelines=>["main"]}
...
[2019-09-08T10:57:39,359][INFO ][logstash.pipeline        ] Pipeline has terminated {:pipeline_id=>"main", :thread=>"#<Thread:0x7db57d5f run>"}
```

Review that the data was reindexed:

```
$ curl 10.37.117.130:9200/_cat/indices/*filebeat-*08*?v
health status index                    uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   filebeat-2019.08.28      qoKiHUjQT5eNVF_wjLi9fA   5   1         17            0    295.4kb        147.7kb
green  open   filebeat-2019.08.29      PiG2ma8zSbSt6sSg7soYPA   5   1         24            0    400.2kb          196kb
green  open   filebeat-2019.08.30      u_Hr9fA5RtOtpabNGUmSpw   5   1         18            0    326.1kb          163kb
green  open   filebeat-2019.08.27      8PWngqFdRPKLEnrCCiw6xA   5   1        301            0    900.9kb          424kb
green  open   filebeat-2019.08.31      XSWZvqQDR0CugD23y6_iaA   5   1         27            0    451.5kb        222.1kb
green  open   filebeat-monthly-2019.08 VZD8iDjfTfeyP-SWB9l2Pg   3   1        387            0    577.8kb        274.7kb
```

Once we are happy with what we are seeing, we can delete the source data:

```
$ curl -XDELETE "10.37.117.130:9200/filebeat-2019.08.*"
{"acknowledged":true}
```
