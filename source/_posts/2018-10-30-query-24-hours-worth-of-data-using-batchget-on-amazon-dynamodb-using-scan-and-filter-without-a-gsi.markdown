---
layout: post
title: "Query 24 Hours worth of Data using BatchGet on Amazon DynamoDB using Scan and Filter without a GSI"
date: 2018-10-30 14:53:43 -0400
comments: true
categories: ["aws", "dynamodb", "python", "boto3", "databases", "nosql"] 
---

I'm testing how to query data in DynamoDB which will always be the retrieval of yesterdays data, without using a Global Secondary Index. 

This is done just to see what other ways you can use to query data based on a specific timeframe.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Use-Case:

Data from DynamoDB needs to be batch processed (daily for the last 24-hours), into a external datasource. Data will be written into DynamoDB, the HK (uuid) and RK (timestamp) will be duplicated to the daily table. But only uuid and timestamp will be duplicated to the daily table, and only data for that day will be written into that datestamp formatted table name.

Let's say data for 2018-10-30 needs to be written into our external data source, we will do a scan on table `tbl-test_20181030`, then from our response we will have a list of HashKeys (uuid) which we will use to do a BatchGet Item on our base table: `tbl-test_base`, which essentially grabs all the data for that day.

If deeper filtering needs to be done on that day, the FilterExpression can be used to do a deeper filtering which leads to grabbing only the filtered down data from the base table.

*Note:* The base table might have millions of items, so a Scan operation on the Base table would be really expensive, as it reads all the items in the table.

Once the data has been processed, the daily or metadata table can be removed.

## DynamoDB Table Design

The base table: `tbl-test_base` will have:

- HashKey: uuid (string)
- RangeKey: timestamp (number)
- Attributes: city, stream, transaction_date, name, metric_uri
- Item will look like:

```python
{
  u'uuid': u'fb4ddeb9-3b5e-47b3-bbab-1aa1d8e8f47b', 
  u'timestamp': 1540891276, 
  u'city': u'sydney', 
  u'stream': u'NONE', 
  u'transaction_date': u'2018-10-30 11:21:16', 
  u'metric_uri': u'some-dummy-metric-uri', 
  u'name': u'frank'
}
```

he Daily Table: `tbl-test_20181030` will look like:

- HashKey: `uuid`
- Attributes: `timestamp`
- Item will look like:

```python
{
  u'uuid': u'fb4ddeb9-3b5e-47b3-bbab-1aa1d8e8f47b', 
  u'timestamp': 1540891276
}
```

## Demonstration using Python

Creating the Metadata table:

```python
import boto3, time, uuid, random

session = boto3.Session(region_name='eu-west-1', profile_name='dev')
resource = session.resource('dynamodb')
client = session.client('dynamodb')

def create_table():
    table_name = "tbl-test_{0}".format(time.strftime("%Y%m%d"))
    response = resource.create_table(
        TableName=table_name,
        KeySchema=[{
            'AttributeName': 'uuid',
            'KeyType': 'HASH'
        }],
        AttributeDefinitions=[{
            'AttributeName': 'uuid',
            'AttributeType': 'S'
        }],
        ProvisionedThroughput={
            'ReadCapacityUnits': 1,
            'WriteCapacityUnits': 1
        }
    )

    resource.Table(table_name).wait_until_exists()

    arn = client.describe_table(TableName=table_name)['Table']['TableArn']
    client.tag_resource(
        ResourceArn=arn,
        Tags=[
            {'Key': 'Name','Value': 'dynamo_table'},
            {'Key': 'Environment','Value': 'Dev'},
            {'Key': 'CreatedBy','Value': 'Ruan'}
        ]
    )
    
    return resource.Table(table_name).table_status

print(create_table())
```

Write 400 Items to DynamoDB:

```python
import boto3, time, uuid, random

session = boto3.Session(region_name='eu-west-1', profile_name='dev')
resource = session.resource('dynamodb')
client = session.client('dynamodb')

base_table = 'tbl-test_base'
meta_table = 'tbl-test_{0}'.format(time.strftime("%Y%m%d"))

people = ['james', 'john', 'frank', 'paul', 'nathan', 'kevin']
cities = ['ireland', 'cape town', 'pretoria', 'paris', 'amsterdam', 'auckland', 'sydney']

def write_dynamo(uuid, timestamp):
    resource.Table(base_table).put_item(
        Item={
            'uuid': uuid, 
            'timestamp': timestamp, 
            'metric_uri': 'some-dummy-metric-uri', 
            'transaction_date': time.strftime("%Y-%m-%d %H:%M:%S"), 
            'name': random.choice(people), 
            'stream': 'NONE', 
            'city': random.choice(cities)
        }
    )

    resource.Table(meta_table).put_item(
        Item={
            'uuid': uuid, 
            'timestamp': timestamp
        }
    )

    return 'Written'

for x in xrange(400):
    time.sleep(1)
    write_dynamo(str(uuid.uuid4()), int(time.time()))
    print(x)
```

Getting Data for 20181030 but also filter data greater than the timestamp attribute, greater than `1540841144` in epoch time (which will give us about 254 items).

The BatchGet Item supports up to 100 items per call, we will limit the scans on 100 items per call, then paginate using the ExlusiveStartKey with the value of our LastEvaluatedKey that we will get from our response:

```python
import boto3,time
from boto3.dynamodb.conditions import Key

base_table = 'tbl-test_base'
meta_table = 'tbl-test_20181030'

session = boto3.Session(region_name='eu-west-1', profile_name='dev')
resource = session.resource('dynamodb')
table = resource.Table(meta_table)
filtering_expression = Key('timestamp').gt(1540841144)

response = table.scan(FilterExpression=filtering_expression, Limit=100)

finished=False
while finished != True:
    if 'LastEvaluatedKey' in response.keys():
        print("Getting {} Items".format(response['Count']))
        items = resource.batch_get_item(RequestItems={base_table: {'Keys': response['Items']}})
        print(items['Responses'][base_table])
        time.sleep(2)
        response = table.scan(FilterExpression=filtering_expression, Limit=100, ExclusiveStartKey=response['LastEvaluatedKey'])
    else:
        print("Getting {} Items".format(response['Count']))
        items = resource.batch_get_item(RequestItems={base_table: {'Keys': response['Items']}})
        print(items['Responses'][base_table])
        finished=True
```

Running it:

```bash
$ python dynamodb-batch-get.py
Getting 100 Items
[{u'city': u'pretoria', u'uuid': u'e8bc0d1c-2b57-4de2-b0e1-35ef1fe0edf1', u'stream': u'NONE', u'timestamp': Decimal('1540846990'), u'transaction_date': u'2018-10-29 23:03:10', u'metric_uri': u'some-dummy-metric-uri', u'name': u'frank'}, {u'city': u'amsterdam', u'uuid':
...
Getting 100 Items
[{u'city': u'sydney', u'uuid': u'5bc51ce9-2809-46c9-a3f2-ff8180086d92', u'stream': u'NONE', u'timestamp': Decimal('1540848599'), u'transaction_date': u'2018-10-29 23:29:59', u'metric_uri': u'some-dummy-metric-uri', u'name': u'frank'}
...
Getting 54 Items
[{u'city': u'cape town', u'uuid': u'5e069f34-0e97-4a49-9ca9-da2213edb689'...
```

Verifying that each call only scans 100 at a time:

```python
>>> response = table.scan(FilterExpression=filtering_expression, Limit=100)
>>> response.keys()
[u'Count', u'Items', u'LastEvaluatedKey', u'ScannedCount', 'ResponseMetadata']
>>> response.get('LastEvaluatedKey')
{u'uuid': u'e8c52a55-ca9e-4718-83d2-1b44a90f43e6'}
>>> response.get('Count')
100
>>> response.get('ScannedCount')
100
```

## Other Thoughts:

Querying data is a lot easier using a Global Secondary Index where you could similarly have the metric_uri as the HashKey and transaction_date as the RangeKey:

```python
>>> response = table.query(
    IndexName='metric_uri-transaction_date-index', 
    KeyConditionExpression=Key('metric_uri').eq('some-dummy-metric-uri') & Key('transaction_date').begins_with('2018-10-30')
)
>>> response['Count']
400
```

Also note that depending on how you setup your GSI, in most cases its a exact duplicate in storage from your base table, so could potentially be double the costs.
