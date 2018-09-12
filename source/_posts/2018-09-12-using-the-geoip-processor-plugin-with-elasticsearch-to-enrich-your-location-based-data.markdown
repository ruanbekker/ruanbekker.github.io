---
layout: post
title: "Using the GeoIP Processor Plugin with Elasticsearch to enrich your location based data"
date: 2018-09-12 10:14:30 -0400
comments: true
categories: ["elasticsearch", "geoip", "location"] 
---

![](https://objects.ruanbekker.com/assets/images/kibana-map-plot-1.png)

So we have documents ingested into Elasticsearch, and one of the fields has a IP Address, but at this moment it's just an IP Address, the goal is to have more information from this IP Address, so that we can use Kibana's Coordinate Maps to map our data on a Geographical Map.

In order to do this we need to make use of the GeoIP Ingest Processor Plugin, which adds information about the grographical location of the IP Address that it receives. This information is retrieved from the [Maxmind Datases](http://dev.maxmind.com/geoip/geoip2/geolite2/).

So when we pass our IP Address through the processor, for example one of Github's IP Addresses: `192.30.253.113` we will in return get:

```
"_source" : {
  "geoip" : {
    "continent_name" : "North America",
    "city_name" : "San Francisco",
    "country_iso_code" : "US",
    "region_name" : "California",
    "location" : {
      "lon" : -122.3933,
      "lat" : 37.7697
    }
  },
  "ip" : "192.30.253.113",
}
```

## Installation

First we need to install the `ingest-geoip` plugin. Change to your elasticsearch home path:

```
$ cd /usr/share/elasticsearch/
$ sudo bin/elasticsearch-plugin install ingest-geoip
```

## Setting up the Pipeline

Now that we've installed the plugin, lets setup our Pipeline where we will reference our GeoIP Processor:

```
$ curl -H 'Content-Type: application/json' -XPUT 'http://localhost:9200/_ingest/pipeline/geoip' -d '
{
  "description" : "Add GeoIP Info",
  "processors" : [
    {
      "geoip" : {
        "field" : "ip"
      }
    }
  ]
}
'
```

## Ingest and Test

Let's create the Index and apply the mapping:

```bash
$ curl -H 'Content-Type: application/json' -XPUT 'http://localhost:9200/my_index' -d '
{
  "mappings": {
    "doc": {
      "properties": {
        "geoip": {
          "properties": {
            "location": {
              "type": "geo_point"
            }
          }
        }
      }
    }
  }
}'
```

Create the Document and specify the pipeline name:

```bash
$ curl -H 'Content-Type: application/json' -XPOST 'http://localhost:9200/my_index/metrics/?pipeline=geoip' -d '
{
  "identifier": "github", 
  "service": "test", 
  "os": "linux", 
  "ip": "192.30.253.113"
}
'
```

Once the document is ingested, have a look at the document:

```bash
$ curl -XGET 'http://localhost:9200/my_index/_search?q=identifier:github&pretty'
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 0.6931472,
    "hits" : [
      {
        "_index" : "my_index",
        "_type" : "doc",
        "_id" : "2QVXzmUBZLvWjZA0DvLO",
        "_score" : 0.6931472,
        "_source" : {
          "identifier" : "github",
          "geoip" : {
            "continent_name" : "North America",
            "city_name" : "San Francisco",
            "country_iso_code" : "US",
            "region_name" : "California",
            "location" : {
              "lon" : -122.3933,
              "lat" : 37.7697
            }
          },
          "service" : "test",
          "ip" : "192.30.253.113",
          "os" : "linux"
        }
      }
    ]
  }
}

```

## Kibana

Let's plot our data on Kibana:

- From Management: Select Index Patterns, Create index pattern, set: `my_index`
- From Visualize: Select Geo Coordinates, select your index: `my_index`
- From Buckets select Geo Corrdinates, Aggregation by GeoHash, then field, select `geoip.location` then hit run and you should see something like this:

![](https://objects.ruanbekker.com/assets/images/kibana-geoip-1.png) 

## Resources:

- https://www.elastic.co/blog/geoip-in-the-elastic-stack
- https://www.elastic.co/guide/en/elasticsearch/plugins/5.3/using-ingest-geoip.html
- https://www.elastic.co/guide/en/elasticsearch/reference/5.3/put-pipeline-api.html
- https://ring.nlnog.net/api/1.0/nodes
