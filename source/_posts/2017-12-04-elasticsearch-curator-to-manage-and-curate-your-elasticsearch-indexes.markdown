---
layout: post
title: "Elasticsearch Curator to Manage and Curate your Elasticsearch Indexes"
date: 2017-12-04 08:39:06 -0500
comments: true
categories: ["elasticsearch", "curator"] 
---

![](https://user-images.githubusercontent.com/567298/53352581-b3892f80-392b-11e9-9532-5db5cbfc8f1c.jpg)

Elasticsearch Curator helps you to manage and curate your Elasticsearch Indices. I will show how to use the Curator in the following ways:

- Create Indexes
- Reindex Indexes
- Set Replica Counts on Indexes
- Delete Indexes

## Install Elasticsearch Curator

Install Elasticsearch Curator as follows:

```bash
$ virtualenv .venv
$ source .venv/bin/activate
$ pip install elasticsearch-curator
```

Populate the configuration whith your Elasticsearch Host details:

```yml config.yml
---
client:
  hosts:
    - es.domain.com
  port: 443
  use_ssl: True
  ssl_no_validate: False
  http_auth:
  timeout: 30
  master_only: False

logging:
  loglevel: INFO
  logfile:
  logformat: default
  blacklist: ['urllib3']
```

## Action: Create Indices

Use Curator to Create Elasticsearch Indexes:

```yml action-create-indices.yml
---
actions:
  create_web-app1-metrics:
    action: create_index
    description: >-
      Create Elasticsearch Index based on Todays Date
      Specify Number of Primary and Replica Shards
      web-app1-metrics-2017.12.04
    options:
      name: '<web-app1-metrics-{now/d}>'
      extra_settings:
        settings:
          number_of_shards: 5
          number_of_replicas: 1
        continue_if_exception: True
        disable_action: False

  create_web-app2-metrics:
    action: create_index
    description: "Create Index with the 1st of this Month in Daily Format - web-app2-metrics-2017.12.01"
    options:
      name: '<web-app2-metrics-{now/M}>'
      extra_settings:
        settings:
          number_of_shards: 5
          number_of_replicas: 2
        continue_if_exception: True
        disable_action: False

  create_web-app3-metrics:
    action: create_index
    description: "Create Index with Last Months Date in Month Format - web-app3-metrics-2017.11"
    options:
      name: '<web-app2-metrics-{now/M-1M{YYYY.MM}}>'
      extra_settings:
        settings:
          number_of_shards: 5
          number_of_replicas: 2
        continue_if_exception: True
        disable_action: False

  create_web-app4-metrics:
    action: create_index
    description: "Create Index with Daily Format 12 Hours from Now - web-app4-metrics-2017.12.05"
    options:
      name: '<web-app2-metrics-{now/d{YYYY.MM.dd|+12:00}}>'
      extra_settings:
        settings:
          number_of_shards: 5
          number_of_replicas: 2
        continue_if_exception: True
        disable_action: False
```

When Running curator, you can append `--dry-run` to test your config/action without touching your data. To create these indexes:

```bash 
$ curator --config config.yml action-create-indices.yml

2017-12-04 14:22:40,252 INFO      Preparing Action ID: create_web-app1-metrics, "create_index"
2017-12-04 14:22:40,303 INFO      GET https://es.domain.com:443/ [status:200 request:0.036s]
2017-12-04 14:22:40,304 INFO      Trying Action ID: create_web-app1-metrics, "create_index": Create Elasticsearch Index based on Todays Date Specify Number of Primary and Replica Shards web-app1-metrics-2017.12.04
2017-12-04 14:22:40,304 INFO      "<web-app1-metrics-{now/d}>" is using Elasticsearch date math.
2017-12-04 14:22:40,304 INFO      Creating index "<web-app1-metrics-{now/d}>" with settings: {'continue_if_exception': True, 'settings': {'number_of_replicas': 1, 'number_of_shards': 5}, 'disable_action': False}
2017-12-04 14:22:41,490 INFO      PUT https://es.domain.com:443/%3Cweb-app1-metrics-%7Bnow%2Fd%7D%3E [status:200 request:1.185s]
2017-12-04 14:22:41,490 INFO      Action ID: create_web-app1-metrics, "create_index" completed.
2017-12-04 14:22:41,490 INFO      Preparing Action ID: create_web-app2-metrics, "create_index"
2017-12-04 14:22:41,533 INFO      GET https://es.domain.com:443/ [status:200 request:0.033s]
2017-12-04 14:22:41,534 INFO      Trying Action ID: create_web-app2-metrics, "create_index": Create Index with the 1st of this Month in Daily Format - web-app2-metrics-2017.12.01
2017-12-04 14:22:41,534 INFO      "<web-app2-metrics-{now/M}>" is using Elasticsearch date math.
2017-12-04 14:22:41,534 INFO      Creating index "<web-app2-metrics-{now/M}>" with settings: {'continue_if_exception': True, 'settings': {'number_of_replicas': 2, 'number_of_shards': 5}, 'disable_action': False}
2017-12-04 14:22:41,634 INFO      PUT https://es.domain.com:443/%3Cweb-app2-metrics-%7Bnow%2FM%7D%3E [status:200 request:0.099s]
2017-12-04 14:22:41,634 INFO      Action ID: create_web-app2-metrics, "create_index" completed.
2017-12-04 14:22:41,634 INFO      Preparing Action ID: create_web-app3-metrics, "create_index"
2017-12-04 14:22:41,673 INFO      GET https://es.domain.com:443/ [status:200 request:0.028s]
2017-12-04 14:22:41,674 INFO      Trying Action ID: create_web-app3-metrics, "create_index": Create Index with Last Months Date in Month Format - web-app3-metrics-2017.11
2017-12-04 14:22:41,674 INFO      "<web-app2-metrics-{now/M-1M{YYYY.MM}}>" is using Elasticsearch date math.
2017-12-04 14:22:41,674 INFO      Creating index "<web-app2-metrics-{now/M-1M{YYYY.MM}}>" with settings: {'continue_if_exception': True, 'settings': {'number_of_replicas': 2, 'number_of_shards': 5}, 'disable_action': False}
2017-12-04 14:22:41,750 INFO      PUT https://es.domain.com:443/%3Cweb-app2-metrics-%7Bnow%2FM-1M%7BYYYY.MM%7D%7D%3E [status:200 request:0.076s]
2017-12-04 14:22:41,751 INFO      Action ID: create_web-app3-metrics, "create_index" completed.
2017-12-04 14:22:41,751 INFO      Preparing Action ID: create_web-app4-metrics, "create_index"
2017-12-04 14:22:41,785 INFO      GET https://es.domain.com:443/ [status:200 request:0.027s]
2017-12-04 14:22:41,786 INFO      Trying Action ID: create_web-app4-metrics, "create_index": Create Index with Daily Format 12 Hours from Now - web-app4-metrics-2017.12.05
2017-12-04 14:22:41,786 INFO      "<web-app2-metrics-{now/d{YYYY.MM.dd|+12:00}}>" is using Elasticsearch date math.
2017-12-04 14:22:41,786 INFO      Creating index "<web-app2-metrics-{now/d{YYYY.MM.dd|+12:00}}>" with settings: {'continue_if_exception': True, 'settings': {'number_of_replicas': 2, 'number_of_shards': 5}, 'disable_action': False}
2017-12-04 14:22:42,182 INFO      PUT https://es.domain.com:443/%3Cweb-app2-metrics-%7Bnow%2Fd%7BYYYY.MM.dd%7C%2B12%3A00%7D%7D%3E [status:200 request:0.396s]
2017-12-04 14:22:42,183 INFO      Action ID: create_web-app4-metrics, "create_index" completed.
2017-12-04 14:22:42,183 INFO      Job completed.
```

Lets have a look at our indices to confirm that our indices was created:

```bash
$ curl -s -XGET "https://es.domain.com/_cat/indices/web-*?v"
health status index                       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   web-app2-metrics-2017.12.01 qJHVyft1THemh1qGvA8u0w   5   2          0            0       810b           810b
green  open   web-app2-metrics-2017.11    y5R4vNfOSh2tiC-yGtkgLg   5   2          0            0       810b           810b
green  open   web-app2-metrics-2017.12.05 -ohbgD6-TmmCeJtVv84dPw   5   2          0            0       810b           810b
green  open   web-app1-metrics-2017.12.04 WeGkgB9FSq-cuLVR7ccQFQ   5   1          0            0       810b           810b
```

## Action: Reindex Indices based on Timestring

I would like to reindex a months worth of index data to a monthly index:

```yml action-reindex.yml
---
actions:
  re-index_web-app1-metrics:
    action: reindex
    description: "reindex web-app1-metrics to monthly index of last months date - archive-web-app1-metrics-2017.11"
    options:
      continue_if_exception: False
      disable_action: False
      wait_interval: 9
      max_wait: -1
      request_body:
        source:
          index: '<web-app1-metrics-{now/d-31d{YYYY.MM.dd}}>'
        dest:
          index: '<archive-web-app1-metrics-{now/M-1M{YYYY.MM}}>'
    filters:
    - filtertype: none
```

Running the Curator to reindex all last months data: `web-app1-metrics-2017.11.{01-31}` to the index: `web-app1-metrics-2017.11`:

```bash
$ curator --config config action-reindex.yml
```

## Curator to Change Replica Counts on your Indices:

We will change all our indices settings to replica count of 2, that is matched with our prefix pattern. We are using `wait_for_completion` so the job will only be completed once the replica count number is updated and data has been replicated to the replica shards.

Our action file:

```yml action-replicas.yml
---
actions:
  increase_replica_2:
    action: replicas
    description: >-
      Increase the replica count to 2 for logstash- prefixed indices older than
      10 days (based on index creation_date)
    options:
      count: 2
      max_wait: -1
      wait_interval: 10
      wait_for_completion: True
      disable_action: False
    filters:
    - filtertype: pattern
      kind: prefix
      value: packet-capture-2017.11.
```

Using Curator to increase our replica count on all the matched indices:

```
$ curator --config config.yml action-replicas.yml
2017-12-04 13:42:41,322 INFO      Health Check for all provided keys passed.
2017-12-04 13:42:41,323 INFO      Action ID: increase_replica_2, "replicas" completed.
2017-12-04 13:42:41,323 INFO      Job completed.
```

## Curator to Delete your Indices:

```
---
# documentation:
# https://www.elastic.co/guide/en/elasticsearch/client/curator/current/ex_delete_indices.html

actions:
  delete-index_web-app1-metrics:
    action: delete_indices
    description: >-
      Delete indices older than 21 days - based on index name, web-app1-metrics-
      prefixed indices. Ignore the error if the filter does not result in an
      actionable list of indices (ignore_empty_list) and exit cleanly.
    options:
      ignore_empty_list: True
      disable_action: False
    filters:
    - filtertype: pattern
      kind: prefix
      value: web-app1-metrics-
    - filtertype: age
      source: name
      direction: older
      timestring: '%Y.%m.%d'
      unit: days
      unit_count: 21
      exclude:

  delete-index_web-app2-metrics:
    action: delete_indices
    description: >-
      Delete indices older than 1 month - based on index name, web-app2-metrics-
      prefixed indices. Ignore the error if the filter does not result in an
      actionable list of indices (ignore_empty_list) and exit cleanly.
    options:
      ignore_empty_list: True
      disable_action: False
    filters:
    - filtertype: pattern
      kind: prefix
      value: web-app2-metrics-
    - filtertype: age
      source: name
      direction: older
      timestring: '%Y.%m.%d'
      unit: months
      unit_count: 1
      exclude:
```

First we will execute a Dry Run:

```
$ curator --config /opt/curator/es-dev/config.yml /opt/curator/es-dev/actions/action-delete.yml --dry-run

2017-12-04 14:43:19,789 INFO      Preparing Action ID: delete-index_web-app1-metrics, "delete_indices"
2017-12-04 14:43:19,850 INFO      GET https://es.domain.com:443/ [status:200 request:0.037s]
2017-12-04 14:43:19,851 INFO      Trying Action ID: delete-index_web-app1-metrics, "delete_indices": Delete indices older than 21 days - based on index name, web-app1-metrics- prefixed indices. Ignore the error if the filter does not result in an actionable list of indices (ignore_empty_list) and exit cleanly.
2017-12-04 14:43:19,859 INFO      GET https://es.domain.com:443/_all/_settings?expand_wildcards=open%2Cclosed [status:200 request:0.008s]
2017-12-04 14:43:19,862 INFO      GET https://es.domain.com:443/ [status:200 request:0.002s]
2017-12-04 14:43:19,957 INFO      DRY-RUN MODE.  No changes will be made.
2017-12-04 14:43:19,957 INFO      (CLOSED) indices may be shown that may not be acted on by action "delete_indices".
2017-12-04 14:43:19,957 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.01 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.02 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.03 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.04 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.05 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.06 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.07 with arguments: {}
2017-12-04 14:43:19,958 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.08 with arguments: {}
2017-12-04 14:43:19,959 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.09 with arguments: {}
2017-12-04 14:43:19,959 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.10 with arguments: {}
2017-12-04 14:43:19,959 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.11 with arguments: {}
2017-12-04 14:43:19,959 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.12 with arguments: {}
2017-12-04 14:43:19,959 INFO      DRY-RUN: delete_indices: web-app1-metrics-2017.11.13 with arguments: {}
2017-12-04 14:43:19,959 INFO      Action ID: delete-index_web-app1-metrics, "delete_indices" completed.
2017-12-04 14:43:19,959 INFO      Preparing Action ID: delete-index_web-app2-metrics, "delete_indices"
2017-12-04 14:43:20,025 INFO      GET https://es.domain.com:443/ [status:200 request:0.050s]
2017-12-04 14:43:20,026 INFO      Trying Action ID: delete-index_web-app2-metrics, "delete_indices": Delete indices older than 1 month - based on index name, web-app2-metrics- prefixed indices. Ignore the error if the filter does not result in an actionable list of indices (ignore_empty_list) and exit cleanly.
2017-12-04 14:43:20,034 INFO      GET https://es.domain.com:443/_all/_settings?expand_wildcards=open%2Cclosed [status:200 request:0.008s]
2017-12-04 14:43:20,039 INFO      GET https://es.domain.com:443/ [status:200 request:0.003s]
2017-12-04 14:43:20,090 INFO      DRY-RUN MODE.  No changes will be made.
2017-12-04 14:43:20,090 INFO      (CLOSED) indices may be shown that may not be acted on by action "delete_indices".
2017-12-04 14:43:20,090 INFO      DRY-RUN: delete_indices: web-app2-metrics-2017.11.01 with arguments: {}
2017-12-04 14:43:20,090 INFO      DRY-RUN: delete_indices: web-app2-metrics-2017.11.02 with arguments: {}
2017-12-04 14:43:20,090 INFO      DRY-RUN: delete_indices: web-app2-metrics-2017.11.03 with arguments: {}
2017-12-04 14:43:20,090 INFO      DRY-RUN: delete_indices: web-app2-metrics-2017.11.04 with arguments: {}
2017-12-04 14:43:20,090 INFO      Action ID: delete-index_web-app2-metrics, "delete_indices" completed.
2017-12-04 14:43:20,090 INFO      Job completed.
```

Everything seems to be as expected, lets run the Curator without the Dry-Run mode:

```bash
$ curator --config config.yml action-delete.yml

2017-12-04 14:43:40,042 INFO      Deleting selected indices: [u'web-app1-metrics-2017.11.06', u'web-app1-metrics-2017.11.07', u'web-app1-metrics-2017.11.04', u'web-app1-metrics-2017.11.05', u'web-app1-metrics-2017.11.02', u'web-app1-metrics-2017.11.03', u'web-app1-metrics-2017.11.01', u'web-app1-metrics-2017.11.08', u'web-app1-metrics-2017.11.09', u'web-app1-metrics-2017.11.11', u'web-app1-metrics-2017.11.10', u'web-app1-metrics-2017.11.13', u'web-app1-metrics-2017.11.12']
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.06
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.07
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.04
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.05
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.02
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.03
2017-12-04 14:43:40,043 INFO      ---deleting index web-app1-metrics-2017.11.01
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.08
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.09
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.11
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.10
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.13
2017-12-04 14:43:40,044 INFO      ---deleting index web-app1-metrics-2017.11.12
2017-12-04 14:43:40,287 INFO      DELETE https://es.domain.com:443/web-app1-metrics-2017.11.01,web-app1-metrics-2017.11.02,web-app1-metrics-2017.11.03,web-app1-metrics-2017.11.04,web-app1-metrics-2017.11.05,web-app1-metrics-2017.11.06,web-app1-metrics-2017.11.07,web-app1-metrics-2017.11.08,web-app1-metrics-2017.11.09,web-app1-metrics-2017.11.10,web-app1-metrics-2017.11.11,web-app1-metrics-2017.11.12,web-app1-metrics-2017.11.13?master_timeout=30s [status:200 request:0.243s]
2017-12-04 14:43:40,417 INFO      Action ID: delete-index_web-app1-metrics, "delete_indices" completed.
2017-12-04 14:43:40,417 INFO      Preparing Action ID: delete-index_web-app2-metrics, "delete_indices"
2017-12-04 14:43:40,453 INFO      Trying Action ID: delete-index_web-app2-metrics, "delete_indices": Delete indices older than 1 month - based on index name, web-app2-metrics- prefixed indices. Ignore the error if the filter does not result in an actionable list of indices (ignore_empty_list) and exit cleanly.
2017-12-04 14:43:40,491 INFO      Deleting selected indices: [u'web-app2-metrics-2017.11.03', u'web-app2-metrics-2017.11.01', u'web-app2-metrics-2017.11.02', u'web-app2-metrics-2017.11.04']
2017-12-04 14:43:40,492 INFO      ---deleting index web-app2-metrics-2017.11.03
2017-12-04 14:43:40,492 INFO      ---deleting index web-app2-metrics-2017.11.01
2017-12-04 14:43:40,492 INFO      ---deleting index web-app2-metrics-2017.11.02
2017-12-04 14:43:40,492 INFO      ---deleting index web-app2-metrics-2017.11.04
2017-12-04 14:43:40,566 INFO      DELETE https://es.domain.com:443/web-app2-metrics-2017.11.01,web-app2-metrics-2017.11.02,web-app2-metrics-2017.11.03,web-app2-metrics-2017.11.04?master_timeout=30s [status:200 request:0.074s]
2017-12-04 14:43:40,595 INFO      GET https://es.domain.com:443/ [status:200 request:0.002s]
2017-12-04 14:43:40,596 INFO      Action ID: delete-index_web-app2-metrics, "delete_indices" completed.
2017-12-04 14:43:40,596 INFO      Job completed.
```

## Resources:

- [Elasticsearch Curator](https://www.elastic.co/guide/en/elasticsearch/client/curator/current/index.html)
