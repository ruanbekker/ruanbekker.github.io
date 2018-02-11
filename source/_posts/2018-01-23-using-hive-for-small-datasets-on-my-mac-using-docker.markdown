---
layout: post
title: "Using Hive for Small Datasets on my Mac using Docker"
date: 2018-01-23 10:06:16 -0500
comments: true
categories: ["bigdata", "hive", "docker"] 
---

I wanted to process a small subset of data, and not wanting to spin up a cluster, so I used `nagasuga/docker-hive` docker image to run Hive on my Mac.

## Running Hive

```bash
$ docker run -it -v /home/me/resource-data.csv:/resource-data.csv nagasuga/docker-hive /bin/bash -c 'cd /usr/local/hive && ./bin/hive'
hive>
```

Once I was entered into my hive shell, I created a table for my CSV data:

## Creating the Table

```sql
hive> create table resources (ResourceType STRING, Owner STRING) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' ;

hive> hive> show tables;
OK
resources

hive> describe resources;
OK
resourcetype        	string
owner               	string
```

## Loading the Data

My csv data is located at `/resource-data.csv` on the container, which I will load into my table:

```sql
hive> load data local inpath '/resource-data.csv' into table resources;
Loading data to table default.resources
```

## Query the Data

Just two simple queries for demonstration:

```sql
hive> select * from resources limit 3;
OK
EC2	 Engineering
EC2	 Finance
EC2	 Product

hive> hive> select count(resourcetype) as num, owner from resources group by owner order by num desc limit 3;
K
50	 Engineering
20	 Product
10	 Finance
```

## Resource:

Thanks to [https://github.com/nagasuga/docker-hive](https://github.com/nagasuga/docker-hive)
