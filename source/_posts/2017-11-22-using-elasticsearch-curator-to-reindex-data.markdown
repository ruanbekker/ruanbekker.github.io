---
layout: post
title: "Using Elasticsearch Curator to Reindex Data"
date: 2017-11-22 09:09:28 -0500
comments: true
categories: ["elasticsearch", "curator"] 
---

Today I was using Elasticsearch Curator to reindex indices that was created on a daily basis, to reindex all the data to one index. I used this route as the old data will not be accessed frequently.

## Install Elasticsearch Curator

```bash
$ docker run -it python:2.7-alpine sh
$ pip install elasticsearch-curator
```

## Create Configs:

Create the curator config:

```yaml config.yml
---
# Remember, leave a key empty if there is no value.  None will be a string,
# not a Python "NoneType"
client:
  hosts:
    - es.endpoint.com
  port: 443
  use_ssl: True
  ssl_no_validate: False
  http_auth: admin:pass
  timeout: 30
  master_only: False

logging:
  loglevel: INFO
  logfile:
  logformat: default
  blacklist: ['urllib3']
```

Create the action config:

```yaml action-reindex.yml
---
# Remember, leave a key empty if there is no value.  None will be a string,
# not a Python "NoneType"
#
# Also remember that all examples have 'disable_action' set to True.  If you
# want to use this action as a template, be sure to set this to False after
# copying it.
actions:
  1:
    description: "Reindex index-2017.10.{30,31} into new-index-2017.10"
    action: reindex
    options:
      disable_action: False
      wait_interval: 9
      max_wait: -1
      request_body:
        source:
          index: ['index-2017.10.*']
        dest:
          index: new-index-2017.10
    filters:
    - filtertype: none
```

## Create the Elasticsearch Index:

Create the Index where we will reindex the data to:

```bash
$ curl -XPUT http://es.endpoint.com/new-index-2017.10 -d '{"settings": {"number_of_shards": 5, "number_of_replicas": 1}}'
```

## Run the Curator:

```bash
$ curator --config curator.yml action-reindex.yml

2017-11-22 14:18:15,138 INFO      Task "reindex from [index-2017.10.*] to [index-2017.10]" with task_id "Za-sn0z3Q9-75xCMRwJ3-A:15782886" has been running for 928.948195354 seconds
2017-11-22 14:18:24,152 INFO      GET https://es.endpoint.com:443/_tasks/Za-sn0z3Q9-75xCMRwJ3-A%3A15782886 [status:200 request:0.005s]
2017-11-22 14:18:24,153 INFO      Task "reindex from [index-2017.10.*] to [new-index-2017.10]" with task_id "Za-sn0z3Q9-75xCMRwJ3-A:15782886" has been running for 937.962740393 seconds
2017-11-22 14:22:23,171 INFO      Action ID: 1, "reindex" completed.
2017-11-22 14:22:23,171 INFO      Job completed.
```

## Resources:

- https://www.elastic.co/guide/en/elasticsearch/client/curator/current/index.html
- https://qbox.io/blog/logstash-elasticsearch-curator-data-retention
