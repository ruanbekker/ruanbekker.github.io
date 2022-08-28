---
layout: post
title: "Capture Geo Location Data with Python Flask and PyGeoIP"
date: 2018-07-16 17:46:01 -0400
comments: true
categories: ["python", "flask", "geoip", "location"] 
---

With the PyGeoIP package you can capture geo location data, which is pretty cool, for example, when you have IOT devices pushing location data to elasticsearch and visualizing the data with Kibana. That will be one example, but the possibilites are endless.

## Dependencies:

Get the Maxmind Geo Database:

```bash
$ wget -N http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
$ gunzip GeoLiteCity.dat.gz
```

Install Python Flask and PyGeoIP:

```bash
$ pip install flask pygeoip
```

## Getting Started with PyGeoIP:

Let's run through a couple of examples on how to get:

- Country Name by IP Address and DNS
- Country Code by IP Address and DNS
- GeoData by IP Address

```python
>>> import pygeoip, json
>>> gi = pygeoip.GeoIP('GeoLiteCity.dat')

>>> gi.country_name_by_addr('8.8.8.8')
'United States'
>>> gi.country_code_by_addr('8.8.8.8')
'US'

>>> gi.country_name_by_name('scaleway.com')
'France'
>>> gi.country_code_by_name('scaleway.com')
'FR'

>>> gi.region_by_name('scaleway.com')
{'region_code': None, 'country_code': 'FR'}

>>> data = gi.record_by_addr('104.244.42.193')
>>> print(json.dumps(data, indent=2))
{
  "city": "San Francisco",
  "region_code": "CA",
  "area_code": 415,
  "time_zone": "America/Los_Angeles",
  "dma_code": 807,
  "metro_code": "San Francisco, CA",
  "country_code3": "USA",
  "latitude": 37.775800000000004,
  "postal_code": "94103",
  "longitude": -122.4128,
  "country_code": "US",
  "country_name": "United States",
  "continent": "NA"
}

>>> data = gi.record_by_name('twitter.com')
>>> print(json.dumps(data, indent=2))
{
  "city": "San Francisco",
  "region_code": "CA",
  "area_code": 415,
  "time_zone": "America/Los_Angeles",
  "dma_code": 807,
  "metro_code": "San Francisco, CA",
  "country_code3": "USA",
  "latitude": 37.775800000000004,
  "postal_code": "94103",
  "longitude": -122.4128,
  "country_code": "US",
  "country_name": "United States",
  "continent": "NA"
}
```

## Python Flask Web App to Capture Data

Let's create a basic Flask App that will capture the data from the client making the request to the server. In this example we will just return the data, but we can filter the data and ingest it into a database like elasticsearch, etc.

```python
from flask import Flask, request, jsonify
import pygeoip, json

app = Flask(__name__)

geo = pygeoip.GeoIP('GeoLiteCity.dat', pygeoip.MEMORY_CACHE)

@app.route('/')
def index():
    client_ip = request.remote_addr
    geo_data = geo.record_by_addr(client_ip)
    return json.dumps(geo_data, indent=2) + '\n'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=False)
```

Run the Server:

```bash
$ python app.py
```

Make a request from the client over a remote connection:

```bash
$ curl http://remote-endpoint.com
{
  "city": "Cape Town",
  "region_code": "11",
  "area_code": 0,
  "time_zone": "Africa/Johannesburg",
  "dma_code": 0,
  "metro_code": null,
  "country_code3": "ZAF",
  "latitude": -01.12345,
  "postal_code": "8000",
  "longitude": 02.123456789,
  "country_code": "ZA",
  "country_name": "South Africa",
  "continent": "AF"
}
```

## Resources:

- [PyGeoIP](http://pygeoip.readthedocs.io/en/latest/getting-started.html)
- [MaxMind](https://dev.maxmind.com/geoip/legacy/install/city/)
