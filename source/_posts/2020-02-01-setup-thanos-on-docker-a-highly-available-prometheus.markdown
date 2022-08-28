---
layout: post
title: "Setup Thanos on Docker: A Highly Available Prometheus"
date: 2020-02-01 01:28:12 +0200
description: "Thanos is a open source, highly available prometheus setup with long term storage capabilites"
comments: true
categories: ["promteheus", "metrics", "thanos"]
---

Today we will look at Thanos, a open source, highly available prometheus setup with long term storage capabilites, that we will run on docker to simplify the setup. 

Note that running this proof of concept does not make it highly available as we will run everything on one host, but it will give you a feel what Thanos is about. In a future post, I will setup Thanos in a multi node environment.

## Prometheus

If you are not familiar with [Prometheus](https://prometheus.io), then have a look at their documentation, but in short, prometheus is a open source monitoring system and time series database developed by soundcloud. 

Prometheus is a monitoring system includes a rich, multidimensional data model, a concise and powerful query language called PromQL, an efficient embedded timeseries database, and over 150 integrations with third-party systems.

## Thanos

Thanos is a highly available prometheus setup with long term storage capabilities. 

Thanos allows you to ship your data to S3/Minio for long storage capabilites, so you could for example only store your "live" data on prometheus for 2 weeks, then everything older than that gets sent to object storage such as amazon s3 or minio. This helps your prometheus instance not to be flooded with data or prevents you from running out of storage space. The nice thing is, when you query for data older than 2 weeks, it will fetch the data from object storage.

Thanos has a global query view, which essentially means you can query your prometheus metrics from one endpoint backed by multiple prometheus servers or cluster.

You can still use the same tools such as Grafana as it utilizes the same Prometheus Query API.

Thanos provides downsampling and compaction, so that you downsample your historical data for massive query speedup when querying large time ranges.

## Thanos Components

Thanos is a clustered system of components which can be categorized as follows:

- Metric sources
  - Thanos provides two components that act as data sources: Prometheus Sidecar and Rule Nodes
  - Sidecar implements gRPC service on top of Prometheus
  - Rule Node directly implements it on top of the Prometheus storage engine it is running
  - Data sources that persist their data for long term storage, do so via the Prometheus 2.0 storage engine
  - Storage engine periodically produces immutable blocks of data for a fixed time range
  - A blocks top-level directory includes chunks, index and meta.json files
  - Chunk files hold a few hundred MB worth of chunks each
  - The index file holds all information needed to lookup specific series by their labels and the positions of their chunks.
  - The `meta.json` file holds metadata about block like stats, time range, and compaction level

- Stores
  - A Store Node acts as a Gateway to block data that is stored in an object storage bucket
  - It implements the same gRPC API as Data Sources to provide access to all metric data found in the bucket
  - Continuously synchronizes which blocks exist in the bucket and translates requests for metric data into object storage requests
  - Implements various strategies to minimize the number of requests to the object storage
  - Prometheus 2.0 storage layout is optimized for minimal read amplification
  - At this time of writing, only index data is cached
  - Stores and Data Sources are the same, store nodes and data sources expose the same gRPC Store API
  - Store API allows to look up data by a set of label matchers and a time range
  - It then returns compressed chunks of samples as they are found in the block data
  - So it's purely a data retrieval API and does not provide complex query execution


- Query Layer
  - Queriers are stateless and horizontally scalable instances that implement PromQL on top of the Store APIs exposed in the cluster
  - Queriers participate in the cluster to be able to resiliently discover all data sources and store nodes
  - Rule nodes in return can discover query nodes to evaluate recording and alerting rules
  - Based on the metadata of store and source nodes, they attempt to minimize the request fanout to fetch data for a particular query
  - The only scalable components of Thanos is the query nodes as none of the Thanos components provide sharding
  - Scaling of storage capacity is ensured by relying on an external object storage system
  - Store, rule, and compactor nodes are all expected to scale significantly within a single instance or high availability pair

The information from above was retrieved from their [website](https://thanos.io/design.md/), feel free to check them out if you want to read more on the concepts of thanos.

The Architecture Overview of Thanos looks like this:

![](https://github.com/thanos-io/thanos/blob/master/docs/img/arch.jpg?raw=true)

## What are we doing today

We will setup a Thanos Cluster with Minio, Node-Exporter, Grafana on Docker. Our Thanos setup will consist of 3 prometheus containers, each one running with a sidecar container, a store container, 2 query containers, then we have the remotewrite and receive containers which node-exporter will use to ship its metrics to.

The minio container will be used as our long-term storage and the mc container will be used to initialize the storage bucket which is used by thanos.

## Deploy the Cluster

Below is the docker-compose.yml and the script to generate the configs for thanos:

<script src="https://gist.github.com/ruanbekker/acd1b17d3aea4c71031e72dfc8ebbb4d.js"></script>

Once you have saved the compose as `docker-compose.yml` and the script as `configs.sh` you can create the configs:

```
$ bash configs.sh
```

The script from above creates the data directory and place all the configs that thanos will use in there. Next deploy the thanos cluster:

```
$ docker-compose -f docker-compose.yml up
```

It should look something like this:

```
$ docker-compose -f docker-compose.yml up
Starting node-exporter ... done
Starting minio         ... done
Starting grafana        ... done
Starting prometheus0    ... done
Starting prometheus1     ... done
Starting thanos-receive  ... done
Starting thanos-store    ... done
Starting prometheus2     ... done
Starting mc             ... done
Starting thanos-sidecar0 ... done
Starting thanos-sidecar1     ... done
Starting thanos-sidecar2     ... done
Starting thanos-remote-write ... done
Starting thanos-query1       ... done
Starting thanos-query0       ... done
Attaching to node-exporter, minio, grafana, mc, prometheus0, prometheus1, thanos-store, prometheus2, thanos-receive, thanos-sidecar0, thanos-sidecar1, thanos-sidecar2, thanos-remote-write, thanos-query0, thanos-query1
```

Access the Query UI, which looks identical to the Prometheus UI: 
- http://localhost:10904/graph

It will look more or less like this:

<img width="1280" alt="image" src="https://user-images.githubusercontent.com/567298/73583506-4e26b280-449b-11ea-96ca-9b0cefec0acd.png">

When we access minio on:
- http://localhost:9000/minio

And under the thanos bucket you will see the objects being persisted:

<img width="1278" alt="image" src="https://user-images.githubusercontent.com/567298/73583542-7ca48d80-449b-11ea-955c-7b1e766229a3.png">

When we access grafana on:
- http://localhost:3000/

Select datasources, add a prometheus datasource and select the endpoint: `http://query0:10904`, which should look like this:

<img width="618" alt="image" src="https://user-images.githubusercontent.com/567298/73583601-d73de980-449b-11ea-9a71-c94e8184336f.png">

When we create a dashboard, you can test a query with `thanos_sidecar_prometheus_up` and it should look something like this:

<img width="1279" alt="image" src="https://user-images.githubusercontent.com/567298/73583684-49aec980-449c-11ea-97bd-35145ff8330c.png">



