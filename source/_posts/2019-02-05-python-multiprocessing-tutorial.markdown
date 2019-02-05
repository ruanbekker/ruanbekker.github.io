---
layout: post
title: "Python Multiprocessing Tutorial"
date: 2019-02-05 10:05:49 -0500
comments: true
categories: ["python", "multiprocessing", "dynamodb", "aws"]
---

I stumbled apon a great [python multiprocessing tutorial](https://tutorialedge.net/python/python-multiprocessing-tutorial/), when I was looking into spawning multiple processes in parallel on a Lambda function.

In this example im getting latencies between regions using tcpping, but instead of running them one at a time, I was looking into spawning them in parralel:

(code made static for demonstration)

```python
import boto3
import os
import json
import multiprocessing as mp
from decimal import Decimal

region_maps = {
    'eu-west-1': {
        'dynamodb': 'dynamodb.eu-west-1.amazonaws.com'
    }, 
    'us-east-1': {
        'dynamodb': 'dynamodb.us-east-1.amazonaws.com'
    }, 
    'us-west-1': {
        'dynamodb': 'dynamodb.us-west-1.amazonaws.com'
    }, 
    'us-west-2': {
        'dynamodb': 'dynamodb.us-west-2.amazonaws.com'
    }
}

def get_results(target_region, target_service, target_endpoint):
    static_results = {
        "address": target_endpoint,
        "attempts": 5,
        "avg": 481.80199999999996,
        "max": 816.25,
        "min": 312.46,
        "port": 443,
        "region": "eu-west-1_{}_{}".format(target_service, target_region),
        "regionTo": target_region,
        "results": [
            {"seq": 1,"time": "816.25"},
            {"seq": 2,"time": "331.50"},
            {"seq": 3,"time": "597.22"},
            {"seq": 4,"time": "312.46"},
            {"seq": 5,"time": "351.58"}
        ],
        "timestamp": "2019-02-05T17:10:32"
    }
    return static_results
 
def dynamodb_write(data):
    ddb = boto3.Session(profile_name='test', region_name='eu-west-1').resource('dynamodb').Table('mydynamotable')
    ddb_parsed = json.loads(json.dumps(data), parse_float=Decimal)
    response = ddb.put_item(Item=ddb_parsed)
    return response

def spawn_work(region):
    target_region = region
    target_service = 'dynamodb'
    target_endpoint = region_maps[target_region][target_service]
    data = get_results(region, target_service, target_endpoint)
    print("pid: {}, data: {}".format(os.getpid(), data))
    response = dynamodb_write(data)

if __name__ == "__main__":
    pool = mp.Pool(mp.cpu_count())
    result = pool.map(spawn_work, ['eu-west-1', 'us-east-1', 'us-west-1', 'us-west-2'])
```

When running it locally, I can see that each job ran in its own pid:

```bash
$ python foo.py
pid: 31224, data: {'attempts': 5, 'min': 312.46, 'timestamp': '2019-02-05T17:10:32', 'address': 'dynamodb.eu-west-1.amazonaws.com', 'max': 816.25, 'region': 'eu-west-1_dynamodb_eu-west-1', 'avg': 481.80199999999996, 'port': 443, 'regionTo': 'eu-west-1', 'results': [{'seq': 1, 'time': '816.25'}, {'seq': 2, 'time': '331.50'}, {'seq': 3, 'time': '597.22'}, {'seq': 4, 'time': '312.46'}, {'seq': 5, 'time': '351.58'}]}

pid: 31225, data: {'attempts': 5, 'min': 312.46, 'timestamp': '2019-02-05T17:10:32', 'address': 'dynamodb.us-east-1.amazonaws.com', 'max': 816.25, 'region': 'eu-west-1_dynamodb_us-east-1', 'avg': 481.80199999999996, 'port': 443, 'regionTo': 'us-east-1', 'results': [{'seq': 1, 'time': '816.25'}, {'seq': 2, 'time': '331.50'}, {'seq': 3, 'time': '597.22'}, {'seq': 4, 'time': '312.46'}, {'seq': 5, 'time': '351.58'}]}

pid: 31226, data: {'attempts': 5, 'min': 312.46, 'timestamp': '2019-02-05T17:10:32', 'address': 'dynamodb.us-west-1.amazonaws.com', 'max': 816.25, 'region': 'eu-west-1_dynamodb_us-west-1', 'avg': 481.80199999999996, 'port': 443, 'regionTo': 'us-west-1', 'results': [{'seq': 1, 'time': '816.25'}, {'seq': 2, 'time': '331.50'}, {'seq': 3, 'time': '597.22'}, {'seq': 4, 'time': '312.46'}, {'seq': 5, 'time': '351.58'}]}

pid: 31227, data: {'attempts': 5, 'min': 312.46, 'timestamp': '2019-02-05T17:10:32', 'address': 'dynamodb.us-west-2.amazonaws.com', 'max': 816.25, 'region': 'eu-west-1_dynamodb_us-west-2', 'avg': 481.80199999999996, 'port': 443, 'regionTo': 'us-west-2', 'results': [{'seq': 1, 'time': '816.25'}, {'seq': 2, 'time': '331.50'}, {'seq': 3, 'time': '597.22'}, {'seq': 4, 'time': '312.46'}, {'seq': 5, 'time': '351.58'}]}
```

Quite useful! Have a look at the link shared for more examples.
