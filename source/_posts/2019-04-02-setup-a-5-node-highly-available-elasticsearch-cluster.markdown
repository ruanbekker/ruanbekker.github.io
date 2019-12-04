---
layout: post
title: "Setup a 5 Node Highly Available Elasticsearch Cluster"
description: "Deploy a highly available 5 node elasticsearch cluster with elasticsearch master and elasticsearch data nodes. search and analytic engine on ubuntu linux."
date: 2019-04-02 05:05:19 -0400
comments: true
categories: ["elasticsearch", "cluster", "databases", "elasticsearch-tutorials"] 
---

![elasticsearch](https://user-images.githubusercontent.com/567298/53352581-b3892f80-392b-11e9-9532-5db5cbfc8f1c.jpg)

This is post 1 of my big collection of **[elasticsearch-tutorials](https://blog.ruanbekker.com/blog/categories/elasticsearch-tutorials)** which includes, setup, index, management, searching, etc. More details at the bottom.

In this tutorial we will setup a **5 node highly available elasticsearch cluster** that will consist of 3 Elasticsearch Master Nodes and 2 Elasticsearch Data Nodes.

> "Three master nodes is the way to start, but only if you're building a full cluster, which at minimum is 3 master nodes plus at least 2 data nodes."
>  - https://discuss.elastic.co/t/should-dedicated-master-nodes-and-data-nodes-be-considered-separately/75093/14

<a href="https://bekkerclothing.com/collections/developer?utm_source=blog.ruanbekker.com&utm_medium=blog&utm_campaign=leaderboard_ad" target="_blank"><img alt="bekker-clothing-developer-tshirts" src="https://user-images.githubusercontent.com/567298/70170981-7c278a80-16d6-11ea-9759-6621d02c1423.png"></a>

## The Overview:

In short the responsibilites of the node types:

**Master Nodes**: Master nodes are responsible for Cluster related tasks, creating / deleting indexes, tracking of nodes, allocate shards to nodes, etc.

**Data Nodes**: Data nodes are responsible for hosting the actual shards that has the indexed data also handles data related operations like CRUD, search, and aggregations. 

For more concepts of Elasticsearch, have a look at their [basic-concepts](https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started-concepts.html) documentation.

Our Inventory will consist of:

**Master Nodes:**

```
Hostname: es-master-1, Private IP: 172.31.0.77
Hostname: es-master-2, Private IP: 172.31.0.45
Hostname: es-master-3, Private IP: 172.31.1.31
```

**Data Nodes:**

```
Hostname: es-data-1, Private IP:172.31.2.30
Hostname: es-data-2, Private IP:172.31.0.83
```

**Reserved Volumes** for Data Nodes:

```
es-data-1: 10GB assigned to /dev/vdb
es-data-2: 10GB assigned to /dev/vdb
```

**Authentication:**

Note that I have configured the bind address for elasticsearch to `0.0.0.0` using `network.host: 0.0.0.0` for this demonstration, but this means that if your server has a public ip address with no firewall rules or no auth, that anyone will be able to interact with your cluster. 

This address will also be reachable for all nodes to see each other. 

It's advisable do protect your endpoint, either with [basic auth using nginx](https://blog.ruanbekker.com/blog/2017/08/31/secure-your-access-to-kibana-5-and-elasticsearch-5-with-nginx-for-aws/) which can be found in the embedded link, or using firewall rules to protect communication from the outside (depending on your setup)

## Setup the Elasticsearch Master Nodes

The setup below how to provision a elasticsearch master node. Repeat this on node: `es-master-1`, `es-master-2`, `es-master-3`

Set your hosts file for name resolution (if you don't have private dns in place):

```
$ cat > /etc/hosts << EOF
127.0.0.1 localhost
172.31.0.77 es-master-1
172.31.0.45 es-master-2
172.31.1.31 es-master-3
172.31.2.30 es-data-1
172.31.0.83 es-data-2
EOF
```

Get the elasticsearch repositories, install the java development kit dependency and install elasticsearch:

```
$ apt update && apt upgrade -y
$ apt install software-properties-common python-software-properties apt-transport-https -y
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
$ echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
$ apt update
$ apt install default-jdk -y
$ apt install elasticsearch -y
```

The elasticsearch config, before we get to the full example config, I just want to show a snippet of how you could split up logs and data.

Note that you can seperate your logging between data/logs like this:

```
# example of log splitting:
...
path:
  logs: /var/log/elasticsearch
  data: /var/data/elasticsearch
...
```

Also, your data can be divided between paths:

```
# example of data paths:
...
path:
  data:
    - /mnt/elasticsearch_1
    - /mnt/elasticsearch_2
    - /mnt/elasticsearch_3
...
```

Bootstrap the elasticsearch config with a cluster name (all the nodes should have the same cluster name), set the nodes as master `node.master: true` disable the `node.data` and specify that the cluster should at least have a minimum of 2 master nodes before it stops. This is used to prevent split brain.

To avoid a split brain, this setting should be set to a quorum of master-eligible nodes:
`(master_eligible_nodes / 2) + 1`

The full example config:

```
$ cat > /etc/elasticsearch/elasticsearch.yml << EOF
cluster.name: es-cluster
node.name: \${HOSTNAME}
node.master: true
node.data: false
path.logs: /var/log/elasticsearch
bootstrap.memory_lock: true
network.host: 0.0.0.0
discovery.zen.minimum_master_nodes: 2
discovery.zen.ping.unicast.hosts: ["es-master-1", "es-master-2", "es-master-3"]
EOF
```

Important settings for your elasticsearch cluster is described on their [docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html):

- [Disable swapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-configuration-memory.html)
- [Increase file descriptors](https://www.elastic.co/guide/en/elasticsearch/reference/current/file-descriptors.html)
- [Ensure sufficient virtual memory](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html)
- [Ensure sufficient threads](https://www.elastic.co/guide/en/elasticsearch/reference/current/max-number-of-threads.html)
- [JVM DNS cache settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/networkaddress-cache-ttl.html)
- [Temporary directory not mounted with noexec](https://www.elastic.co/guide/en/elasticsearch/reference/current/executable-jna-tmpdir.html)

```
$ cat > /etc/default/elasticsearch << EOF
ES_STARTUP_SLEEP_TIME=5
MAX_OPEN_FILES=65536
MAX_LOCKED_MEMORY=unlimited
EOF
```

Ensure that pages are not swapped out to disk by requesting the JVM to lock the heap in memory by setting `LimitMEMLOCK=infinity`. Set the maxiumim file descriptor number for this process: `LimitNOFILE` and increase the number of threads using `LimitNPROC`:

```
$ vim /usr/lib/systemd/system/elasticsearch.service

[Service]
LimitMEMLOCK=infinity
LimitNOFILE=65535
LimitNPROC=4096
...
```

Increase the limit on the number of open files descriptors to user elasticsearch of 65536 or higher

```
$ cat > /etc/security/limits.conf << EOF
elasticsearch soft memlock unlimited
elasticsearch hard memlock unlimited
EOF
```

Increase the value of the mmap counts as elasticsearch uses mmapfs directory to store its indices:

```
$ sysctl -w vm.max_map_count=262144
```

For a permanent setting, update `vm.max_map_count` in `/etc/sysctl.conf` and run 

```
$ sysctl -p /etc/sysctl.conf 
```

Prepare the directories and set the ownership to elasticsearch:

```
$ mkdir /usr/share/elasticsearch/data
$ chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data
```

Reload the systemd daemon, enable and start elasticsearch

```
$ systemctl daemon-reload
$ systemctl enable elasticsearch
$ systemctl restart elasticsearch
```

Once all 3 elasticsearch masters has been started, verify that they are listening: `netstat -tulpn | grep 9200` then look at the cluster health:

```
$ curl http://127.0.0.1:9200/_cluster/health?pretty
{
  "cluster_name" : "es-cluster",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 3,
  "number_of_data_nodes" : 0,
  "active_primary_shards" : 0,
  "active_shards" : 0,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

Have a look at the nodes, you will see that the node.role for now shows `mi`:

```
$ curl http://127.0.0.1:9200/_cat/nodes?v
ip          heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.163.68.8           11          80  18    0.28    0.14     0.09 mi        -      es-master-2
10.163.68.5           14          80  14    0.27    0.18     0.11 mi        *      es-master-1
10.163.68.4           15          79   6    0.62    0.47     0.18 mi        -      es-master-3
```

## Setup the Elasticsearch Data Nodes

Now that we have our 3 elasticsearch master nodes running, its time to provision the 2 elasticsearch data nodes. This setup needs to be repeated on both `es-data-1` and `es-data-2`.

Configure the hosts file for name resolution:

```
$ cat > /etc/hosts << EOF
127.0.0.1 localhost
172.31.0.77 es-master-1
172.31.0.45 es-master-2
172.31.1.31 es-master-3
172.31.2.30 es-data-1
172.31.0.83 es-data-2
EOF
```

Get the elasticsearch repositories, install the java development kit dependency and install elasticsearch:

```
$ apt update && apt upgrade -y
$ apt install software-properties-common python-software-properties apt-transport-https -y
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
$ echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
$ apt update
$ apt install default-jdk -y
$ apt install elasticsearch -y
```

Since we attached an extra disk to our data nodes, verify that you can see the disk:

```
$ lsblk
NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
vda    253:0    0  25G  0 disk
└─vda1 253:1    0  25G  0 part /
vdb    253:16   0  10G  0 disk             <----
```

Provision the block device with xfs or anything else that you prefer, create the directory where elasticsearch data will reside, change the ownership that elasticsearch has permission to write/read, set the device on startup and mount the disk:

```
$ mkfs.xfs /dev/vdb
$ mkdir /data
$ mkdir /data/nodes
$ chown -R elasticsearch:elasticsearch /data
$ chown -R elasticsearch:elasticsearch /data/nodes
$ echo '/dev/vdb /data xfs defaults 0 0' >> /etc/fstab
$ mount -a
```

Verify that the disk is mounted:

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            994M     0  994M   0% /dev
tmpfs           201M  3.1M  197M   2% /run
/dev/vda1        25G  1.8G   23G   8% /
/dev/vdb         10G   33M   10G   1% /data
```

Bootstrap the elasticsearch config with a cluster name, set the `node.name` to an identifier, in this case I will use the servers hostname, set the `node.master` to false as this will be data nodes, also enable these nodes as data nodes: `node.data: true`, configure the `path.data: /data` to the path that we configured, etc:

```
$ cat > /etc/elasticsearch/elasticsearch.yml << EOF
cluster.name: es-cluster
node.name: \${HOSTNAME}
node.master: false
node.data: true
path.data: /data
path.logs: /var/log/elasticsearch
bootstrap.memory_lock: true
network.host: 0.0.0.0
discovery.zen.minimum_master_nodes: 2
discovery.zen.ping.unicast.hosts: ["es-master-1", "es-master-2", "es-master-3"]
EOF
```

Set a couple of important settings for your elasticsearch cluster is described on their [docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html):

```
$ cat > /etc/default/elasticsearch << EOF
ES_STARTUP_SLEEP_TIME=5
MAX_OPEN_FILES=65536
MAX_LOCKED_MEMORY=unlimited
EOF
```

Disable swapping, increase the file descriptors and increase the maximum number of threads:

```
$ vim /usr/lib/systemd/system/elasticsearch.service
[Service]
LimitMEMLOCK=infinity
LimitNOFILE=65535
LimitNPROC=4096
```

Also update them via limits.conf:

```
$ cat > /etc/security/limits.conf << EOF
elasticsearch soft memlock unlimited
elasticsearch hard memlock unlimited
EOF
```

Reload the systemd daemon, enable and start elasticsearch. Allow it to start and check if the ports are listening with `netstat -tulpn | grep 9200`, then:

```
$ systemctl daemon-reload
$ systemctl enable elasticsearch
$ systemctl restart elasticsearch
```

Verify that everything works as expected, look at the cluster health and look at the status and number of nodes:

```
$ curl http://127.0.0.1:9200/_cluster/health?pretty
{
  "cluster_name" : "es-cluster",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 5,
  "number_of_data_nodes" : 2,
  "active_primary_shards" : 0,
  "active_shards" : 0,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

Look at the nodes api and you will see that we now have the extra 2 nodes showing up on `node.role` as `di`:

```
$ curl http://127.0.0.1:9200/_cat/nodes?v
ip           heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
10.163.68.7             9          96   6    0.12    0.11     0.03 di        -      es-data-2
10.163.68.5            10          80   2    0.20    0.09     0.08 mi        *      es-master-1
10.163.68.11           12          96   9    0.12    0.09     0.03 di        -      es-data-1
10.163.68.4            10          79   0    0.00    0.12     0.11 mi        -      es-master-3
10.163.68.8            12          79   1    0.05    0.06     0.07 mi        -      es-master-2
```

## Interact with Elasticsearch

Let's interact with elasticsearch, the overview:

```
$ curl http://127.0.0.1:9200
{
  "name" : "es-data-1",
  "cluster_name" : "es-cluster",
  "cluster_uuid" : "5BLs4sxsSEK-4OxlGnmlmw",
  "version" : {
    "number" : "6.7.0",
    "build_flavor" : "default",
    "build_type" : "deb",
    "build_hash" : "8453f77",
    "build_date" : "2019-03-21T15:32:29.844721Z",
    "build_snapshot" : false,
    "lucene_version" : "7.7.0",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

Let's look at the Health API:

```
$ curl http://127.0.0.1:9200/_cat/health?v
epoch      timestamp cluster    status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1554154652 21:37:32  es-cluster green           5         2     10   5    0    0        0             0                  -                100.0%
```

Let's ingest some data into elasticsearch, we will create an index named `first-index` with some dummy data about people, username, name, surname, location and hobbies:

```
$ curl -H 'Content-Type: application/json' -XPOST http://127.0.0.1:9200/first-index/docs/ -d '{"username": "mikes", "name": "mike", "surname": "steyn", "location": {"country": "south africa", "city": "cape town"}, "hobbies": ["sport", "coffee"]}'

$ curl -H 'Content-Type: application/json' -XPOST http://127.0.0.1:9200/first-index/docs/ -d '{"username": "clarissas", "name": "clarissa", "surname": "smith", "location": {"country": "ireland", "city": "dublin"}, "hobbies": ["shopping", "reading", "chess"]}'

$ curl -H 'Content-Type: application/json' -XPOST http://127.0.0.1:9200/first-index/docs/ -d '{"username": "franka", "name": "frank", "surname": "adams", "location": {"country": "new zealand", "city": "auckland"}, "hobbies": ["programming", "swimming", "rugby"]}'
```

Now that we ingested our data into elasticsearch, lets have a look at the Indices API, where the number of documents, size etc should reflect:

```
$ curl http://127.0.0.1:9200/_cat/indices?v
health status index       uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   first-index 1o6yM7tCSqagqoeihKM7_g   5   1          3            0     40.6kb         20.3kb
```

Now lets request a search, which will give you by default 10 returned documents:

```
$ curl http://127.0.0.1:9200/first-index/_search?pretty
{
  "took" : 116,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "first-index",
        "_type" : "docs",
        "_id" : "-NTO2mkB8pugP4aC2jtZ",
        "_score" : 1.0,
        "_source" : {
          "username" : "mikes",
          "name" : "mike",
          "surname" : "steyn",
          "location" : {
            "country" : "south africa",
            "city" : "cape town"
          },
          "hobbies" : [
            "sport",
            "coffee"
          ]
        }
      },
      {
        "_index" : "first-index",
        "_type" : "docs",
        "_id" : "-tTR2mkB8pugP4aCAzvG",
        "_score" : 1.0,
        "_source" : {
          "username" : "franka",
          "name" : "frank",
          "surname" : "adams",
          "location" : {
            "country" : "new zealand",
            "city" : "auckland"
          },
          "hobbies" : [
            "programming",
            "swimming",
            "rugby"
          ]
        }
      },
      {
        "_index" : "first-index",
        "_type" : "docs",
        "_id" : "-dTP2mkB8pugP4aC1ztI",
        "_score" : 1.0,
        "_source" : {
          "username" : "clarissas",
          "name" : "clarissa",
          "surname" : "smith",
          "location" : {
            "country" : "ireland",
            "city" : "dublin"
          },
          "hobbies" : [
            "shopping",
            "reading",
            "chess"
          ]
        }
      }
    ]
  }
}
```

Let's have a look at our shards using the Shards API, you will also see where each document is assigned to a specific shard, and also if its a primary or replica shard:

```
$ curl http://127.0.0.1:9200/_cat/shards?v
index       shard prirep state   docs store ip           node
first-index 4     p      STARTED    0  230b 10.163.68.7  es-data-2
first-index 4     r      STARTED    0  230b 10.163.68.11 es-data-1
first-index 2     p      STARTED    0  230b 10.163.68.7  es-data-2
first-index 2     r      STARTED    0  230b 10.163.68.11 es-data-1
first-index 3     r      STARTED    1 6.6kb 10.163.68.7  es-data-2
first-index 3     p      STARTED    1 6.6kb 10.163.68.11 es-data-1
first-index 1     r      STARTED    2  13kb 10.163.68.7  es-data-2
first-index 1     p      STARTED    2  13kb 10.163.68.11 es-data-1
first-index 0     p      STARTED    0  230b 10.163.68.7  es-data-2
first-index 0     r      STARTED    0  230b 10.163.68.11 es-data-1
```

Then we can also use the Allocation API to see the size of our indices, disk space per node:

```
$ curl http://127.0.0.1:9200/_cat/allocation?v
shards disk.indices disk.used disk.avail disk.total disk.percent host         ip           node
     5       20.3kb    32.4mb      9.9gb      9.9gb            0 10.163.68.11 10.163.68.11 es-data-1
     5       20.3kb    32.4mb      9.9gb      9.9gb            0 10.163.68.7  10.163.68.7  es-data-2
```

Let's search for anyone with the surname `smith`:

```
$ curl -s http://127.0.0.1:9200/first-index/_search?q=surname=smith | jq .
{
  "took": 22,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 1,
    "max_score": 0.2876821,
    "hits": [
      {
        "_index": "first-index",
        "_type": "docs",
        "_id": "-dTP2mkB8pugP4aC1ztI",
        "_score": 0.2876821,
        "_source": {
          "username": "clarissas",
          "name": "clarissa",
          "surname": "smith",
          "location": {
            "country": "ireland",
            "city": "dublin"
          },
          "hobbies": [
            "shopping",
            "reading",
            "chess"
          ]
        }
      }
    ]
  }
}
```

Let's search for anyone with `rugby` as one of their hobbies:

```
$ curl -s http://127.0.0.1:9200/first-index/_search?q=hobbies=rugby | jq .
{
  "took": 23,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 1,
    "max_score": 0.64072424,
    "hits": [
      {
        "_index": "first-index",
        "_type": "docs",
        "_id": "-tTR2mkB8pugP4aCAzvG",
        "_score": 0.64072424,
        "_source": {
          "username": "franka",
          "name": "frank",
          "surname": "adams",
          "location": {
            "country": "new zealand",
            "city": "auckland"
          },
          "hobbies": [
            "programming",
            "swimming",
            "rugby"
          ]
        }
      }
    ]
  }
}
```

## More on Elasticsearch

I am planning to write up **elasticsearch** articles on the following topics:

* [Setting up a 5 Node HA Elasticsearch Cluster]()
* Indexes / Replicas
* Search Queries
* Delete Queries
* Elasticsearch Snapshots and Restores on S3
* Mapping Templates
* Resizing Index Shards
* Dealing with Old Timeseries Data
* Elasticsearch Percentiles
* Managing Yellow and Red Status Clusters
* Managing High JVM Memory Pressure
* and more

As I finish up the writing of these posts they will be published under the [#elasticsearch-tutorials](https://blog.ruanbekker.com/blog/categories/elasticsearch-tutorials) category on my blog and for any other elasticsearch tutorials, you can find them under the [#elasticsearch](https://blog.ruanbekker.com/blog/categories/elasticsearch) category.

Oke byyyyyye :D

## Resources

- [Elasticsearch](https://www.elastic.co/products/elasticsearch)
- [Elasticsearch Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
