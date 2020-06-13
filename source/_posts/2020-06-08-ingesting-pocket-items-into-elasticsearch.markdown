---
layout: post
title: "Ingesting Pocket.com Links into Elasticsearch"
date: 2020-06-08 23:06:23 +0200
comments: true
categories: ["elasticsearch", "python", "pocket"] 
---

![python-elasticsearch-pocket](https://img.sysadmins.co.za/wngib2.png)

Links that I stumble upon, I always save to [getpocket.com](https://getpocket.com) and tag them with the relevant info. So the one day I had this random idea to list my links per category on a web service and I was wondering how to approach that scenario, which lead me to this.

In this post we will consume all our saved bookmarks from pocket.com and ingest them into elasticsearch. But we dont want to read all the items from pocket's api every single time when the consumer run, therefore I have a method of checkpointing the last save run with a timestamp, so the next time it runs, we have context where to start from

## What will we be doing

We will authenticate with pocket, then write the code how we will read the data from pocket and ingest them into elasticsearch.

## Authentication

Head over to the [developer console](https://getpocket.com/developer/apps/new) on pocket and create a new application then save your config in `config.py` which we will have as:

```
application_name = "Awesome Links"
application_link = "https://getpocket.com/developer/app/x/x"
application_url = "https://awesome-links.domain"
consumer_key = "x"
access_token = "x"
es_host = ""
es_user = ""
es_pass = ""
```

Ensure that you have the requests library installed (`pip install requests`), the code that I used to get a access token:

```
import config
import requests
import webbrowser
import time

CONSUMER_KEY = config.consumer_key
BASE_URL = "https://getpocket.com"
REDIRECT_URL = "localhost" # <-- you can run python -m SimpleHTTPServer 80 to have a local server listening on port 80
HEADERS = {"Content-Type": "application/json; charset=UTF-8", "X-Accept": "application/json"}

def request_code():
    payload = {
        "consumer_key": CONSUMER_KEY,
        "redirect_uri": REDIRECT_URL,
    }
    response = requests.post("https://getpocket.com/v3/oauth/request", headers=HEADERS, json=payload)
    print("request_code")
    print(response.json())
    return response.json()["code"]

def request_access_token(code):
    payload = {
        "consumer_key": CONSUMER_KEY,
        "code": code,
    }
    response = requests.post("https://getpocket.com/v3/oauth/authorize", headers=HEADERS, json=payload)
    print("request_access_token")
    print(response.json())
    time.sleep(10)
    return response.json()["access_token"]

def request_authorization(code):
    url = "https://getpocket.com/auth/authorize?request_token={code}&redirect_uri={redirect_url}".format(code=code, redirect_url=REDIRECT_URL)
    print("request_authorization")
    print(url)
    webbrowser.open(url, new=2)

def authenticate_pocket():
    code = request_code()
    request_authorization(code)
    return request_access_token(code)

authenticate_pocket()
# access_token will be returned
```

## Main App

Once we have our access_token we can save that to our `config.py`, we will also be working with elasticsearch so we can add our elasticsearch info there as well:

```
#!/usr/bin/env python

import config
import requests
import time

CONSUMER_KEY = config.consumer_key
ACCESS_TOKEN = config.access_token
HEADERS = {"Content-Type": "application/json; charset=UTF-8", "X-Accept": "application/json"}
ES_HOST = config.es_host
ES_USER = config.es_user
ES_PASS = config.es_pass

def write_checkpoint(timestamp):
    response = requests.put(
        'https://{eshost}/pocket-data/_doc/checkpoint'.format(eshost=ES_HOST),
        auth=(ES_USER, ES_PASS),
        json={
            "checkpoint_timestamp": timestamp
        }
    )
    return {"checkpoint_timestamp": timestamp}

def get_checkpoint():
    response = requests.get(
        'https://{eshost}/pocket-data/_doc/checkpoint'.format(ES_HOST),
        auth=(ES_USER, ES_PASS)
    )
    checkpoint_timestamp = response.json()['_source']['checkpoint_timestamp']
    return checkpoint_timestamp

def ingest_to_es(payload):
    response = requests.put(
        'https://{eshost}/pocket-data/_doc/{item_id}'.format(eshost=ES_HOST, item_id=payload['item_id']),
        auth=(ES_USER, ES_PASS),
        json=payload
    )
    return response.json()

def convert_timestamp(epoch):
    return time.strftime('%Y-%m-%d', time.localtime(int(epoch)))

def mapper(pocket_item):
    try:
        payload = {
            "item_id": pocket_item['item_id'],
            "time_added": convert_timestamp(pocket_item['time_added']),
            "url": pocket_item['resolved_url'],
            "title": pocket_item['resolved_title'],
            #"excerpt": pocket_item['excerpt'],
            "tags": list(pocket_item['tags'].keys())
        }
    except:
        print("error, item has been skipped:")
        print(pocket_item)
        payload = "skip"
    return payload

def ingest_pocket_items(payload):
    pocket_items = list()
    pocket_items.extend(payload['list'].keys())
    last_scraped_time = payload['since']
    number_of_items = len(pocket_items)
    print('got {} items from pocket'.format(len(pocket_items)))
    time.sleep(5)
    if len(pocket_items) > 0:
        for pocket_item in pocket_items:
            mapped_payload = mapper(payload['list'][pocket_item])
            #print(mapped_payload)
            if mapped_payload != "skip":
                ingest_to_es(mapped_payload)
            print("Number of items left to ingest: {}".format(number_of_items))
            number_of_items-=1
    else:
        print('nothing new')
    print('writing checkpoint to es: {}'.format(last_scraped_time))
    write_checkpoint(last_scraped_time)
    return 'done'

def fetch_pocket_items(timestamp):
    response = requests.post(
        "https://getpocket.com/v3/get",
        headers=HEADERS,
        json={
            "consumer_key": CONSUMER_KEY,
            "access_token": ACCESS_TOKEN,
            "state": "all",
            "contentType": "article",
            "sort": "newest",
            "detailType": "complete",
            "since": int(timestamp)
        }
    )
    return response.json()

# get checkpoint
print('getting checkpoint id')
checkpoint_timestamp = get_checkpoint()
print('got checkpoint id: {}'.format(checkpoint_timestamp))
time.sleep(5)

# fetch items from pocket
print('fetch items from pocket')
pocket_response = fetch_pocket_items(checkpoint_timestamp)

# write
print('ingesting pocket items into es')
ingest_pocket_items(pocket_response)
```

So what we are doing here is that we are reading from the pocket api all the data that you saved in your account, and save the current time in epoch format, which we will need to tell our run when was the last time we consumed and keep that value in memory.

Then from the data we received, we will map the data that we are interested in, into key/value pairs and then ingest the data into elasticsearch.

After the initial ingestion has been done, which can take some time depending on how many items you have on pocket, as soon as it's done it will write the checkpoint time to elasticsearch so that the client know the next time from what time to search from again. 

This way we dont ingest all the items again, testing it:

```
$ python server.py
getting checkpoint id
got checkpoint id: 1591045652
fetch items from pocket
ingesting pocket items into es
got 2 items from pocket
Number of items left to ingest: 2
Number of items left to ingest: 1
writing checkpoint to es: 1591392580
```

Add one more item to pocket, then run our ingester again:

```
$ python server.py
getting checkpoint id
got checkpoint id: 1591392580
fetch items from pocket
ingesting pocket items into es
got 1 items from pocket
Number of items left to ingest: 1
writing checkpoint to es: 1591650259
```

Search for one document on elasticsearch:

```
$ curl -u user:pass 'https://es.domain/pocket-data/_search?pretty=true&size=1'
{
  "took" : 194,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 766,
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "pocket-data",
        "_type" : "_doc",
        "_id" : "2676106577",
        "_score" : 1.0,
        "_source" : {
          "item_id" : "2676106577",
          "time_added" : "2020-05-03",
          "url" : "https://programmaticponderings.com/2019/07/30/managing-aws-infrastructure-as-code-using-ansible-cloudformation-and-codebuild/",
          "title" : "Managing AWS Infrastructure as Code using Ansible, CloudFormation, and CodeBuild",
          "tags" : [
            "ansible",
            "aws",
            "cicd",
            "cloudformation",
            "devops"
          ]
        }
      }
    ]
  }
}
```

Search for aws tags:

```
$ curl -u x:x 'https://es.domain/pocket-data/_search?q=tags:aws&pretty=true&size=1'
{
  "took" : 101,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 112,
    "max_score" : 2.6346242,
    "hits" : [
      {
        "_index" : "pocket-data",
        "_type" : "_doc",
        "_id" : "2673747670",
        "_score" : 2.6346242,
        "_source" : {
          "item_id" : "2673747670",
          "time_added" : "2019-07-28",
          "url" : "https://github.com/lgoodridge/serverless-chat",
          "title" : "lgoodridge/serverless-chat",
          "tags" : [
            "aws"
          ]
        }
      }
    ]
  }
}
```

## Now what

Now that our data is in elasticsearch, we can build a search engine or a web application that can list our favorite links per category. I wil write up a post on the search engine in the future.

## Thank You

If you liked this please send me a shout out on Twitter: [@ruanbekker](https://twitter.com/ruanbekker)
