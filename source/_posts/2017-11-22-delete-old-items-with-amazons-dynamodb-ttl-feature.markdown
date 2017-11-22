---
layout: post
title: "Delete Old Items with Amazons DynamoDB TTL Feature"
date: 2017-11-22 17:47:31 -0500
comments: true
categories: ["aws", "dynamodb", "nosql", "python"] 
---

As you may know a DynamoDB Table's Partition Splits on 2 factors, Read/Write Capacity Units and when Storage goes over 10GB. 

## Automatically Deleting Old Data in DynamoDB:

With the TTL Feature in DynamoDB, we can enable TTL on a Attribute on our Table, the attributes value needs to have an epoc time value, more specifically, when the current time is the same as the value of on of the items attribute value, that item will be expired, which will be deleted.

## What we will be doing:

- Use Boto3 in Python
- Create DynamoDB Table: 'session-table'
- Set TTL Attribute on 'ExpirationTime', so whenever the epoch time is equals to the AttributeValue it will delete the item
- Do one PUT Item with 48 Hours expiry Date from the Write
- Do 240 PUT Items with 24 Hours expiry Date from the Write
- Verify after 24 hours if only one item is in our table.

## Pre-Requisites:

Install the AWS CLI, Boto3 and configure your credentials, so that boto3 can read from your credential provider:

```bash
$ pip install awscli
$ pip install boto3
$ aws configure
AWS Access Key ID [****************XYZ]: 
AWS Secret Access Key [****************xyz]: 
Default region name [eu-west-1]: 
Default output format [json]: 
```

## Create the Table:

```python
$ python

import boto3
session = boto3.Session(region_name='eu-west-1', profile_name='default')
dynamodb = session.resource('dynamodb')
table = dynamodb.create_table(
    TableName='session-table',
    KeySchema=[
        {
            'AttributeName': 'sessionid', 
            'KeyType': 'HASH'
        }
    ], 
    AttributeDefinitions=[
        {
            'AttributeName': 'sessionid', 
            'AttributeType': 'S'
        } 
    ], 
    ProvisionedThroughput={
        'ReadCapacityUnits': 2, 
        'WriteCapacityUnits': 2
    }
)
```

From the Console, enable TTL and set the TTL Attribute on `ExpirationTime`

## Write Data to DynamoDB

We have 2 functions that will write the current epoch time to the `CreationTime` attribute and `ExpirationTime` will have the current time plus the 24 hours in seconds, which will be used for the 240 items that will be written using the for loop and the other function with the 48 hours of seconds, which will be a single write item.

Then we will just write random data to the session data attribute:

```python
import boto3
import time
import random
from uuid import uuid4

names = ['james', 'john', 'steve', 'peter', 'frank', 'steven', 'jonathan', 'stephen', 'will', 'adam', 'william']
retailer = ['shoprite', 'edgars', 'pnp', 'bestbuy', 'ok', 'grocer-a', 'amazon', 'seveneleven', 'shop-a']

session = boto3.Session(region_name='eu-west-1', profile_name='dev')
ddb = session.resource('dynamodb')
client = ddb.Table('session-table')

def current_time():
    int(time.time())

def current_time():
    return int(time.time())

def expiration_time():
    return int(time.time()) + 86400

def 48h_expiration_time():
    return int(time.time()) + 172800

# expiry on 48 hours
client.put_item(
    Item={
        'sessionid': str(uuid4()),
        'CreationTime': current_time(),
        'ExpirationTime': 48h_expiration_time(),
        'SessionData': {
            'Name': random.choice(names),
            'Retailer': random.choice(retailer),
            'TimeOfTransaction': current_time(),
            'Amount': random.randint(100,9000)
        }
    }
)

# expiry on 24 hours
for x in xrange(240):
    time.sleep(1)
    client.put_item(
        Item={
            'sessionid': str(uuid4()),
            'CreationTime': current_time(),
            'ExpirationTime': expiration_time(),
            'SessionData': {
                'Name': random.choice(names),
                'Retailer': random.choice(retailer),
                'TimeOfTransaction': current_time(),
                'Amount': random.randint(100,9000)
            }
        }
    )
```

## Verify:

Verify after 24 hours if the item with the 48 hour expiration time is still in our table:

```python
client.get_item( Key={'sessionid': '69c2a472-f70e-4d72-b25f-e27573696b0c'} )['Item']

{
    u'ExpirationTime': Decimal('1510672221'),
    u'CreationTime': Decimal('1510585821'),
    u'sessionid': u'69c2a472-f70e-4d72-b25f-e27573696b0c',
    u'SessionData': {
        u'Amount': Decimal('3553'),
        u'Retailer': u'amazon',
        u'TimeOfTransaction': Decimal('1510585821'),
        u'Name': u'steve'
    }
}
```

Which we can see is still there, when doing a GET item on one of our 24 hour expired items, we can see that its no longer there:

```python
client.get_item( Key={'sessionid': '70b9fc8c-19c4-49d3-bf63-046e992335af'} )['Item']

Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
KeyError: 'Item'
```

Doing a SCAN operation, we should see one item:

```python
import json
r = client.scan(TableName='session-table', Limit=10, Select='COUNT', ReturnConsumedCapacity='TOTAL')

print(json.dumps(r, indent=4))
{
    "Count": 1,
    "ScannedCount": 1,
    "ConsumedCapacity": {
        "CapacityUnits": 0.5,
        "TableName": "session-table"
    },
    "ResponseMetadata": {
        "RetryAttempts": 0,
        "HTTPStatusCode": 200,
        "RequestId": "",
        "HTTPHeaders": {
            "x-amzn-requestid": "",
            "content-length": "107",
            "server": "Server",
            "connection": "keep-alive",
            "x-amz-crc32": "2228370918",
            "date": "Tue, 14 Nov 2017 12:02:31 GMT",
            "content-type": "application/x-amz-json-1.0"
        }
    }
}
```

So we can confirm that the TTL feature expires the data based on the epoch value we provide our item.

## Resources:

- https://sysadmins.co.za/interfacing-amazon-dynamodb-with-python-using-boto3/
- http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
