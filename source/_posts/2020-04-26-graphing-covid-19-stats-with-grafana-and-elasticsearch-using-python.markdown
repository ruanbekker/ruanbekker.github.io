---
layout: post
title: "Graphing Covid-19 Stats with Grafana and Elasticsearch using Python"
date: 2020-04-26 02:24:27 +0200
comments: true
categories: ["grafana", "elasticsearch", "python", "covid19", "monitoring"] 
---

![coronavirus-covid19-grafana-metrics](https://user-images.githubusercontent.com/567298/80421197-62345180-88dc-11ea-9e0a-557199aaf613.png)

I stumbled upon a [github repository](https://github.com/pomber/covid19/) that stores time-series data in json format of corona virus / covid19 statistics, which get updated daily.

I was curious to see data about my country and want to see how metrics will look like after our lockdown started, so I decided to consume that data with **Python** and the requests library, then ingest data about covid19 into **Elasticsearch** and the visualize the data with **Grafana**.

## Sample of the Data

Let's have a peek at the data to determine how we will use it to write to Elasticsearch. Let's consume the data with python:

```
>>> import requests
>>> import json
>>> response = requests.get('https://pomber.github.io/covid19/timeseries.json').json()
```

Now let's determine the data type:

```
>>> type(response)
<type 'dict'>
```

Now as it's a dictionary, let's look at they keys:

```
>>> response.keys()
[u'Canada', u'Sao Tome and Principe', u'Lithuania', u'Cambodia', u'Ethiopia',....
```

So let's take a look how the data looks like if we do a lookup for Canada:

```
>>> type(response['Canada'])
<type 'list'>
```

As we can see it's a list, we can count how many items is in our list:

```
>>> len(response['Canada'])
94
```

Now let's peek at the data by accessing our first index of our list:

```
>>> response['Canada'][0]
{u'date': u'2020-1-22', u'confirmed': 0, u'recovered': 0, u'deaths': 0}
```

So our data will look like this:

```
{
  [
    'Country Name': [
      {
        'date': '<string>', 
        'confirmed': '<int>', 
        'recovered': '<int>', 
        'deaths': '<int>'
      },
      {
        'date': '<string>',
        'confirmed': '<int>',
        'recovered': '<int>',
        'deaths': '<int>'
      },
    ],
    'Country Name': [
      ...
    ]
  ]
}
```

## Some issues we need to fix

As you can see the date is displayed as `2020-1-22` instead of `2020-01-22`, I want to make it consistent as I will be ingesting the data with a `@timestamp` key which we will use the date from the returned data. So first we will need to convert that before we ingest the data. 

The other thing I was thinking of is that, if for some reason we need to ingest this data again, we dont want to sit with duplicates (same document with different \_id's), so for that I decided to generate a hash value that consist of the date and the country, so if the script run to ingest the data, it will use the same id for the specific document, which would just overwrite it, therefore we won't sit with duplicates.

So the idea is to ingest a document to elasticsearch like this: 

```
doc = {
    "_id": "sha_hash_value",
    "day": "2020-01-22",
    "timestamp": "@2020-01-22 00:00:00",
    "country": "CountryName",
    "confirmed": 0,
    "recovered": 0,
    "deaths": 0
}
```

## How we will ingest the data

The first run will load all the data and ingest all the data up to the current day to elasticsearch. Once that is done, we will add code to our script to only ingest the most recent day's data into elasticsearch, which we will control with a cronjob.

Create a index with a mapping to let Elasticsearch know `timestamp` will be a date field:

```
$ curl -XPUT -H 'Content-Type: application/json' \
  -u username:pass 'https://es.domain.com/coronastats' -d \
  '{"mappings": {"foo1": {"properties": {"timestamp" : {"type" : "date","format" : "yyyy-MM-dd HH:mm:ss"}}}}}'
```

Once our index is created, create the python script that will load the data, loop through each country's daily data and ingest it into elasticsearch:

```python
#!/usr/bin/python
import requests
import datetime as dt
import json
import hashlib

url = 'https://pomber.github.io/covid19/timeseries.json'
elasticsearch_url = "https://es.domain.com"
elasticsearch_username = ""
elasticsearch_password = ""

api_response = requests.get(url).json()

def convert_datestamp(day):
    return str(dt.datetime.strptime(day, '%Y-%m-%d'))

def hash_function(country, date):
    string_to_hash = country + date
    hash_obj  = hashlib.sha1(string_to_hash.encode('utf-8'))
    hash_value = hash_obj.hexdigest()
    return hash_value

def map_es_doc(payload, country):
    doc = {
        "day": payload['date'],
        "timestamp": convert_datestamp(payload['date']),
        "country": country,
        "confirmed": payload['confirmed'],
        "recovered": payload['recovered'],
        "deaths": payload['deaths']
    }
    return doc

def ingest(doc_id, payload):
    response = requests.put(
        elasticsearch_url + '/coronastats/coronastats/' + doc_id,
        auth=(elasticsearch_username, elasticsearch_password),
        headers={'content-type': 'application/json'},
        json=payload
    )
    return response.status_code

for country in api_response.keys():
    try:
        for each_payload in api_response[country]:
            doc_id = hash_function(country, each_payload['date'])
            doc = map_es_doc(each_payload, country)
            response = ingest(doc_id, doc)
            print(response)
    except Exception as e:
        print(e)
```

Run the script to ingest all the data into elasticsearch. Now we will create the script that will run daily to only ingest the previous day's data, so that we only ingest the latest data and not all the data from scratch again.

I will create this file in `/opt/scripts/corona_covid19_ingest.py`:

```
#!/usr/bin/python
import requests
import datetime as dt
import json
import hashlib

url = 'https://pomber.github.io/covid19/timeseries.json'
elasticsearch_url = "https://es.domain.com"
elasticsearch_username = ""
elasticsearch_password = ""

api_response = requests.get(url).json()

yesterdays_date = dt.date.today() - dt.timedelta(days=1)

def convert_datestamp(day):
    return str(dt.datetime.strptime(day, '%Y-%m-%d'))

def hash_function(country, date):
    string_to_hash = country + date
    hash_obj  = hashlib.sha1(string_to_hash.encode('utf-8'))
    hash_value = hash_obj.hexdigest()
    return hash_value

def map_es_doc(payload, country):
    doc = {
        "day": payload['date'],
        "timestamp": convert_datestamp(payload['date']),
        "country": country,
        "confirmed": payload['confirmed'],
        "recovered": payload['recovered'],
        "deaths": payload['deaths']
    }
    return doc

def ingest(doc_id, payload):
    response = requests.put(
        elasticsearch_url + '/coronastats/coronastats/' + doc_id,
        auth=(elasticsearch_username, elasticsearch_password),
        headers={'content-type': 'application/json'},
        json=payload
    )
    return response.status_code

for country in api_response.keys():
    try:
        for each_payload in api_response[country]:
            if convert_datestamp(each_payload['date']).split()[0] == str(yesterdays_date):
                print("ingesting latest data for {country}".format(country=country))
                doc_id = hash_function(country, each_payload['date'])
                doc = map_es_doc(each_payload, country)
                response = ingest(doc_id, doc)
                print(response)
    except Exception as e:
        print(e)
```

The only difference with this script is that it checks if the date is equals to yesterday's date, and if so the document will be prepared and ingested into elasticsearch. We will create a cronjob that runs this script every morning at 08:45.

First make the file executable:

```
$ chmod +x /opt/scripts/corona_covid19_ingest.py
```

Run `crontab -e` and add the following

```
45 8 * * * /opt/scripts/corona_covid19_ingest.py
```

## Visualize the Data with Grafana

We will create this dashboard:

![corona-covid-19-dashboard](https://user-images.githubusercontent.com/567298/80418135-35ca0680-88d7-11ea-83f6-3432a903333d.png)

We need a elasticsearch datasource that points to the index that we ingest our data into. Head over to datasources, add a elasticsearch datasource and set the index to `coronastats` and add the timefield as `timestamp`.

We want to make the dashboard dynamic to have a **"country"** dropdown selector, for that go to the dashboard settings, select variable and add a country variable:

![covid19-dashboard-variables](https://user-images.githubusercontent.com/567298/80419463-7cb8fb80-88d9-11ea-959f-8f37ae3f6dc7.png)

First panel: "Reported Cases per Day":

![covid19-reported-cases](https://user-images.githubusercontent.com/567298/80419572-af62f400-88d9-11ea-802e-7eeacb61ee19.png)

Second panel: "Confirmed Cases":

![covid19-confirmed-cases](https://user-images.githubusercontent.com/567298/80419675-db7e7500-88d9-11ea-98a5-3aae4d9a6c87.png)

Third panel: "Recovered Cases":

![covid19-recovered-cases](https://user-images.githubusercontent.com/567298/80419750-fa7d0700-88d9-11ea-82a3-f26ff8c807ef.png)

Now, if we select Italy, Spain and France as an example, we will see something like this:

![covid19-country-stats](https://user-images.githubusercontent.com/567298/80419966-56479000-88da-11ea-8f30-39ac3da27007.png)

## Thank You

Although its pretty cool visualizing data, the issue that we are in at the moment with coronavirus / covid19 is really scary and we should all do our part to try and stay home, sanitize and try not to spread the virus. Together we can all do great things by reducing the spread of this virus.

Stay safe everyone.
