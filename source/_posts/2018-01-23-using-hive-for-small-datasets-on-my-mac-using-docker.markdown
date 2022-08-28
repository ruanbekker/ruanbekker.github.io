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

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

Ad space:

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

<p>

Thanks for reading!
