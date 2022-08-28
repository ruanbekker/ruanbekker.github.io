---
layout: post
title: "Get Application Performance Metrics on Python Flask with Elastic APM on Kibana and Elasticsearch"
date: 2018-11-11 13:09:18 -0500
comments: true
categories: ["elastic", "kibana", "elasticsearch", "apm", "metrics", "flask"] 
---

![](https://objects.ruanbekker.com/assets/images/elastic-apm-banner.png)

In this post we will setup a Python Flask Application which includes the APM Agent which will collect metrics, that gets pushed to the APM Server. If you have not setup the Elastic Stack with / or APM Server, you [can follow this post](https://blog.ruanbekker.com/blog/2018/11/11/setup-apm-server-on-ubuntu-for-your-elastic-stack-to-get-insights-in-your-application-performance-metrics/) to setup the needed.

Then we will make a bunch of HTTP Requests to our Application and will go through the metrics per request type.

## Application Metrics

Our Application will have the following Request Paths:

- `/` - Returns static text
- `/delay` - random delays to simulate increased response latencies
- `/upstream` - get data from a upstream provider, if statements to provide dummy 200, 404 and 502 reponses to visualize
- `/5xx` - request path that will raise an exception so that we can see the error via apm
- `/sql-write` - inserts 5 rows into a sqlite database
- `/sql-read` - executes a select all from the database
- `/sql-group` - sql query to group all the cities and count them

This is just simple request paths to demonstrate the metrics via APM (Application Performance Monitoring) on Kibana.

## Install Flask and APM Agent

Create a virtual environment and install the dependencies:

```bash
$ apt install python python-setuptools -y
$ easy_install pip
$ pip install virtualenv
$ pip install elastic-apm[flask]
$ pip install flask
```

For more info on [APM Configuration](https://www.elastic.co/guide/en/apm/agent/python/current/getting-started.html).

## Instrument a Bare Bones Python Flask app with APM:

A Barebones app with APM Configured will look like this:

```python
from flask import Flask, jsonify
from elasticapm.contrib.flask import ElasticAPM
from elasticapm.handlers.logging import LoggingHandler

app = Flask(__name__)
apm = ElasticAPM(app, server_url='http://localhost:8200', service_name='flask-app-1', logging=True)

@app.route('/')
def index():
    return jsonify({"message": "response ok"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
```

This will provide metrics on the `/` request path. In order to trace transaction ids from the metrics, we need to configure the index on Kibana. To do this, head over to Kibana, Management, Index Patterns, Add Index Pattern, `apm*`, select `@timestamp` as the time filter field name.

This will allow you to see the data when tracing the transaction id's via the Discover UI.

## Create the Python Flask App

Create the Flask App with the request paths as mentioned in the beginning:

```python
import sqlite3, requests, time, logging, random
from flask import Flask, jsonify
from elasticapm.contrib.flask import ElasticAPM
from elasticapm.handlers.logging import LoggingHandler

names = ['ruan', 'stefan', 'philip', 'norman', 'frank', 'pete', 'johnny', 'peter', 'adam']
cities = ['cape town', 'johannesburg', 'pretoria', 'dublin', 'kroonstad', 'bloemfontein', 'port elizabeth', 'auckland', 'sydney']
lastnames = ['smith', 'bekker', 'admams', 'phillips', 'james', 'adamson']

conn = sqlite3.connect('database.db')
conn.execute('CREATE TABLE IF NOT EXISTS people (name STRING, age INTEGER, surname STRING, city STRING)')
#sqlquery_write = conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
seconds = [0.002, 0.003, 0.004, 0.01, 0.3, 0.2, 0.009, 0.015, 0.02, 0.225, 0.009, 0.001, 0.25, 0.030, 0.018]

app = Flask(__name__)
apm = ElasticAPM(app, server_url='http://localhost:8200', service_name='my-app-01', logging=False)

@app.route('/')
def index():
    return jsonify({"message": "response ok"})

@app.route('/delay')
def delay():
    time.sleep(random.choice(seconds))
    return jsonify({"message": "response delay"})

@app.route('/upstream')
def upstream():
    r = requests.get('https://api.ruanbekker.com/people').json()
    r.get('country')
    if r.get('country') == 'italy':
        return 'Italalia!', 200
    elif r.get('country') == 'canada':
        return 'Canada!', 502
    else:
        return 'Not Found', 404

@app.route('/5xx')
def fail_with_5xx():
    value = 'a' + 1
    return jsonify({"message": value})

@app.route('/sql-write')
def sqlw():
    conn = sqlite3.connect('database.db')
    conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
    conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
    conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
    conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
    conn.execute('INSERT INTO people VALUES("{}", "{}", "{}", "{}")'.format(random.choice(names), random.randint(18,40), random.choice(lastnames), random.choice(cities)))
    conn.commit()
    conn.close()
    return 'ok', 200

@app.route('/sql-read')
def sqlr():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute('select * from people')
    rows = cur.fetchall()
    conn.close()
    return 'ok', 200

@app.route('/sql-group')
def slqg():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute('select count(*) as num, city from people group by city')
    rows = cur.fetchall()
    conn.close()
    return 'ok', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
```

Run the app:

```bash
$ python app.py
```

At this point, we wont have any data on APM as we need to make requests to our application. Let's make 10 HTTP GET Requests on the `/` Request Path:

```bash
$ count=0 && while [ $count -lt 10 ]; do curl http://application-routable-address:80/; sleep 1; count=$((count+1)); done
```

## Visualize the Root Request Path

Head over to Kibana, Select APM and you will see something similar like below when selecting the timepicker to 15 minutes at the right top corner. This page will give you the overview of all your configured applications and the average response times over the selected time, transactions per minute, errors per minute etc:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-home-root.png)

When you select your application, you will find the graphs on you response times and requests per minute, also a breakdown per request path:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-app-view-1.png)

When selecting the request path, in this case `GET /`, you will find a breakdown of metrics only for that request and also the response time distribution for that request path, if you select frame from the response time distribution, it will filter the focus to that specific transaction.

![](https://objects.ruanbekker.com/assets/images/elastic-apm-req-view-1.png)

When you scroll a bit down to the Transaction Sample section, you will find data about the request, response, system etc:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-app-transaction-1.png)

From the Transaction Sample, you can select the View Transaction in Discover button, which will trace that transaction id on the Discover UI:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-transaction-disc-1.png)

Increasing the http curl clients running simultaneously from different servers and increasing the time for 15 minutes to have more metrics will result in the screenshot below, notice the 6ms response time can easily be traced selecting it in the response time distribution, then discovering it in the UI, which will give you the raw data from that request:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-req-view-2.png)

## Viewing Application Errors in APM

Make a couple of requests to `/5xx`:

```bash
$ curl http://application-routable-endpoint:80/5xx
```

Navigate to the app, select Errors, then you will see the exception details that was returned. Here we can see that in our code we tried to concatenate integers with strings:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-error-1.png)

Furthermore we can select that error and it will provide us a direct view on where in our code the error gets generated:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-error-details-1.png)

Pretty cool right?! You can also further select the library frames, which will take you to the lower level code that raised the exception. If this errors can be drilled down via the discover ui, to group by source address etc.

## Simulate Response Latencies:

Make a couple of requests to the `/delay` request path, and you should see the increased response times from earlier:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-app-view-delay.png)

## Requests where Database Calls are Executed

The while loop to call random request paths:

```bash
count=0 && while [ $count -lt 1000 ]; 
do 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-read; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-group; 
  curl -H "Host: my-eu-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-us-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-read; 
  curl -H "Host: my-eu-server" -i http://x.x.x.x/sql-group; 
  curl -H "Host: my-us-server" -i http://x.x.x.x/sql-group; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-write; 
  curl -H "Host: my-eu-server" -i http://x.x.x.x/sql-group; 
  curl -H "Host: my-za-server" -i http://x.x.x.x/sql-group; 
  count=$((count+1)); 
done
```

When we look at our applications performance monitoring overview, we can see the writes provide more latencies as the group by's:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-view-1.png)

The `/sql-write` request overview:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlwrite-1.png)

When selecting a transaction sample, we can see the timeline of each database call:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlwrite-1-details.png)

When looking at the `/sql-group` request overview, we can see that the response times increasing overtime, as more data is written to the database, it takes longer to read and group all the data from the database:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlgroup-1.png)

The transaction details shows the timeline of the database query from that request:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlgroup-1-details.png)

When you select the database select query on the timeline view, it will take you to the exact database query that was executed:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlgroup-1-span.png)

When we include a database call with a external request to a remote http endpoint, we will see something like:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-db-sqlread-ext.png)

## Viewing 4xx and 5xx Response Codes

From the application code we are returning 2xx, 4xx, and 5xx response codes for this demonstration to visualize them:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-app-response-codes.png)

## Configuring more Applications

Once more apps are configured, and they start serving traffic, they will start appearing on the APM UI as below:

![](https://objects.ruanbekker.com/assets/images/elastic-apm-apps.png) 

APM is available for other languages as well and provides a getting started snippets from the APM UI. For more information on APM, have a look at their [Documentation](https://www.elastic.co/solutions/apm)

Hope this was useful.

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
