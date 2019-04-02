---
layout: post
title: "Setup Kibana Dashboards for Nginx log data to understand the behavior"
description: "build kibana dashboards to understand your web servers logs for analysis"
date: 2019-04-02 12:34:18 -0400
comments: true
categories: ["kibana", "elasticsearch", "logs", "visualizations", "dashboards", "analytics"] 
---


![kibana](https://user-images.githubusercontent.com/567298/55419050-44c77380-5574-11e9-988c-dae1e001f7bd.png)

In this tutorial we will setup a Basic Kibana Dashboard for a Web Server that is running a Blog on Nginx.

## What do we want to achieve?

We will setup common visualizations to give us an idea on how our blog/website is doing. 

In some situations we need to create visualizations to understand the behavior of our log data in order to answer these type of questions:

1. I want a heat map to see where people are connecting from
2. I want a piechart that represents the percentage of cities accessing my blog
3. Top 10 Most Accessed Pages
4. Top 5 HTTP Status Codes
5. Top 10 Pages that returned 404 Responses
6. The Top 10 User Agents
7. Timeseries: Status Codes Over Time
8. Timeseries: Successfull Website Hits over time
9. Counter with Website Hits
10. Average Bytes Returned
11. Tag Cloud with the City Names that Accessed my Blog

## Pre-Requirements

I am consuming my nginx access logs with filebeat and shipping them to elasticsearch. You can check out [this blogpost](https://blog.ruanbekker.com/blog/2019/03/27/ship-your-logs-to-elasticsearch-with-filebeat/) to set that up.

The GeoIP Processor plugin is installed on elasticsearch to enrich our data with geographical information. You can check out [this blogpost](https://blog.ruanbekker.com/blog/2018/09/12/using-the-geoip-processor-plugin-with-elasticsearch-to-enrich-your-location-based-data/) to setup geoip.

You can setup [Kibana and Elasticsearch on Docker](https://blog.ruanbekker.com/blog/2018/04/29/running-a-3-node-elasticsearch-cluster-with-docker-compose-on-your-laptop-for-testing/) or setup a [5 Node Elasticsearch Cluster](https://blog.ruanbekker.com/blog/2019/04/02/setup-a-5-node-highly-available-elasticsearch-cluster/)

## Setup Kibana Visulizations

Head over to Kibana, make sure that you have added the `filebeat-*` index patterns. If not, head over to Management -> Index Patterns -> Create Index -> Enter filebeat-* as you Index Pattern, select Next, select your @timestamp as your timestamp field, select create.

Now from the visualization section we will add 11 Visualizations. Everytime that you create a visualization, make sure that you select filebeat as your pattern (thats if you are using filebeat).

When configuring your visualization it will look like the configuration box from below:

<img width="337" alt="image" src="https://user-images.githubusercontent.com/567298/55053831-1aeaea00-5066-11e9-93cf-edfd2ac98e44.png">


## Geomap: Map to see where people are connecting from

<img width="728" alt="kibana geomap" src="https://user-images.githubusercontent.com/567298/55258476-9cf83000-526b-11e9-8560-014098c435ee.png">

Select New Visualization: Coordinate Map

```
  -> Metrics, Value: Count. 
     Buckets, Geo Coordinates, Aggregation: Geohash, 
     Field: nginx.access.geoip.location. 
```

Save the visualization, in my case Nginx:GeoMap:Filebeat

## Piechart: Cities

This can give us a quick overview on the percentage of people interested in our website grouped per city.

<img width="688" alt="image" src="https://user-images.githubusercontent.com/567298/55258529-c44efd00-526b-11e9-900a-e93ed7eed11e.png">

Select New Visualization, Pie

```
 -> Metrics: Slice Size, Aggregation: Count
 -> Buckets: Split Slices, 
    Aggregation: Terms, Field: nginx.access.geoip.city_name, 
    Order by: metric: count, 
    Order: Descending, Size: 20
```

Save Visualization.

## Top 10 Accessed Pages

Great for seeing which page is popular, and Kibana makes it easy to see which page is doing good over a specific time.

<img width="750" alt="image" src="https://user-images.githubusercontent.com/567298/55258583-f2ccd800-526b-11e9-98b8-4f1da917cb52.png">

New Visualization: Vertical 

```
  -> Metrics: Y-Axis, Aggregation: Count
  -> Buckets: X-Axis, Aggregation: Terms, 
     Field: nginx.access.url, 
     Ordery by: Metric count, 
     Order: Descending, Size 10
```

I would like to remove `/rss` and `/` from my results, so in the search box:

```
NOT (nginx.access.url:"/" OR nginx.access.url:"/rss/" OR nginx.access.url:"/subscribe/" OR nginx.access.url:*.txt)
```

Save Visualization.

## Top 5 HTTP Status Codes

A Grouping of Status Codes (You should see more 200's) but its quick to identify when 404's spike etc.

<img width="692" alt="image" src="https://user-images.githubusercontent.com/567298/55258695-44756280-526c-11e9-887c-bd58e9b25750.png">

Select new visualization: Vertical Bar

```
  -> Metrics: Y-Axis, Aggregation: Count
  -> Buckets: X-Axis, Aggregation: Terms, 
     Field: nginx.access.response_code, 
     Ordery by: Metric count, 
     Order: Descending, Size 5
```

Save Visualization

## Top 404 Pages

So when people are requesting pages that does not exist, it could most probably be bots trying to attack your site, or trying to gain access etc. This is a great view to see which ones are they trying and then you can handle it from there.

<img width="699" alt="image" src="https://user-images.githubusercontent.com/567298/55259089-5b688480-526d-11e9-963d-936a61285507.png">

```
  -> Metrics: Y-Axis, Aggregation: Count
  -> Buckets: X-Axis, Aggregation: Terms, 
     Terms, Field: nginx.access.url, 
     Order by: Metric count, 
     Order: Descending, Size 20
```

## Top 10 User Agents

Some insights to see the top 10 browsers.

<img width="611" alt="image" src="https://user-images.githubusercontent.com/567298/55258763-74246a80-526c-11e9-9873-da2766e4a518.png">

New Visualization: Data Table

```
  -> Metrics: Y-Axis, Aggregation: Count
  -> Buckets: Split Rows, 
     Aggregation: Terms, 
     Field: nginx.access.user_agent.name, 
     Ordery by: Metric count, 
     Order: Descending, Size 10
```

Save Visualization

## Timeseries: Status Codes over Time

With timeseries data its great to see when there was a spike in status codes, when you identify the time, you can further investigate why that happened.

New Visualization: Timelion

```
.es(index=filebeat*, timefield='@timestamp', q=nginx.access.response_code:200).label('OK'), .es(index=filebeat*, timefield='@timestamp', q=nginx.access.response_code:404).label('Page Not Found')
```

## Timeseries: Successfull Website Hits over Time

This is a good view to see how your website is serving traffic over time.

<img width="734" alt="image" src="https://user-images.githubusercontent.com/567298/55258920-eac16800-526c-11e9-85ca-5ebff8978b2b.png">

New Visualization: Timelion

```
.es(index=filebeat*, timefield='@timestamp', q=nginx.access.response_code:200).label('200')
```

## Count Metric: Website Hits

A counter to see the number of website hits over time.

<img width="606" alt="image" src="https://user-images.githubusercontent.com/567298/55258980-17757f80-526d-11e9-8664-91afda3db62c.png">

New Visualization: Metric

```
  -> Search Query: fields.blog_name:sysadmins AND nginx.access.response_code:200
  -> Metrics: Y-Axis, Aggregation: Count
```

## Average Bytes Transferred

Line chart with the amount of bandwidth being transferred.

<img width="677" alt="image" src="https://user-images.githubusercontent.com/567298/55259036-3c69f280-526d-11e9-90fe-0853d2c0313d.png">

```
New Visualization: Line

-> Metrics: Y-Axis, Aggregation: Average, Field: nginx.access.body_sent.bytes
-> Buckets: X-Axis, Aggregation: Date Histogram, Field: @timestamp
```

## Tag Cloud with Most Popular Cities

I've used cities here, but its a nice looking visualization to group the most accessed fields. With server logs you can use this for the usernames failed in ssh attempts for example.

<img width="646" alt="image" src="https://user-images.githubusercontent.com/567298/55259343-14c75a00-526e-11e9-88dd-7c3a3f396280.png">

```
  -> Metrics: Tag size, Aggregation: Count
  -> Buckets: Tags, 
     Aggregation: Terms, 
     Field: nginx.access.geoip.city_name, 
     Ordery by: Metric count, 
     Order: Descending, Size 10
```

## Create the Dashboard

Now that we have all our visualizations, lets build the dashboard that hosts all our visualizations.

Select Dashboard -> Create New Dashboard -> Add -> Select your visualizations -> Reorder and Save

The visualizations in my dashboard looks like this:

<img width="1266" alt="image" src="https://user-images.githubusercontent.com/567298/55418811-b8b54c00-5573-11e9-810d-d244d27c4fb3.png">

This is a basic dashboard but its just enough so that you can get your hands dirty and build some awesome visualizations.

