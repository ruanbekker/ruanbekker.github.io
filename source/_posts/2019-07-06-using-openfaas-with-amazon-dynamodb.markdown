---
layout: post
title: "Using OpenFaas with Amazon DynamoDB"
date: 2019-07-06 19:11:23 -0400
comments: true
categories: ["openfaas", "aws", "dynamodb", "serverless"] 
---

<img width="1105" alt="image" src="https://user-images.githubusercontent.com/567298/60761941-f4205480-a053-11e9-9ad5-9e45948c9833.png">

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) ![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social) ![Twitter Follow](https://img.shields.io/twitter/follow/ruanbekker.svg?style=social)

# Using OpenFaaS with Amazon DynamoDB

You can use your OpenFaaS functions to store and retrieve data to and from a persistent layer that sits outside the OpenFaaS framework. The database that we will use in this tutorial is Amazon's DynamoDB.

If you are not familiar with the service, Amazon's DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability.

At the end of this tutorial you will be able to invoke your functions to read and write items to DynamoDB with a dedicated IAM User that is only allowed to access DynamoDB, and secrets managed by your OpenFaaS framework.

## What we will be doing in this Tutorial

In this tutorial we will cover a couple of things, and a summary on the to do list is:

* Create a OpenFaaS IAM User, DynamoDB IAM Policy, associate the Policy to the User using the AWS CLI
* Create a AWS Access Key, and save the Access Key and Secret key to file
* Create OpenFaaS Secrets of the Access Key and Secret Key, remove the files from disk
* Create 3 OpenFaaS Functions: write, lookup and get
* Invoke the functions, read and write from DynamoDB

Our 3 functions will do very basic operations for this demonstration, but I believe this is a good starting point.

All the examples of this blog post is available in [this github repository](https://github.com/ruanbekker/blog-assets/tree/master/openfaas-dynamodb)

## The Use-Case Scenario

In this scenario we want to store user information into DynamoDB, we will use a hash that we will calculate using the users ID Number + Lastname. So when we have thousands or millions of items, we dont need to search through the entire table, but since we can re-calculate the sha hash, we can do a single GetItem operation to find the entry about the user in question.

* Lookup Function:

The lookup function will calculate the hash by passing the users ID Number and Lastname, this will return a hash which will be teh primary key attribute of our table design. This hash value is required to do a GetItem on the user in question.

* Get Function:

The Get function will interface with DynamoDB, it reads the AWS access key and secret key from the secrets path to authenticate with AWS and utilizes environment variables for the region and table name. This will do a GetItem on the DynamoDB Table and retrieve the Item. If the item is not found, it will return it in the response.

* Write Function:

The write function will also interface with DynamoDB, the ID, Name and Payload will be included in the request body on our POST Request.

## Note on Secrets and Environment Variables

I am treating my environment variables and secrets different from each other. The secrets such as my AWS access keys are stored on the cluster and the application reads them and stores the values in memory.

The environment variables such as non-secret information, such as my dynamodb table name and aws region, is defined in my environment variables.

This [post](http://movingfast.io/articles/environment-variables-considered-harmful/) and this [post](https://diogomonica.com/2017/03/27/why-you-shouldnt-use-env-variables-for-secret-data/) goes a bit more into detail on why you should not use environment variables for secret data, which I found from [this link](https://github.com/openfaas/faas-netes/issues/153#issuecomment-370924478)

Enough info, let's get to the fun stuff

## Pre-Requirements:

You need a AWS Account (or you can use dynamodb-local), OpenFaaS and faas-cli. Documentation available below:
- https://docs.openfaas.com/contributing/get-started/

## Provision a DynamoDB Table

I have a admin IAM account configured on my default profile, using the aws-cli tools generate the cli-skeleton that is required to provision a dynamodb table:

```bash
$ aws dynamodb create-table --generate-cli-skeleton > ddb.json
```

My table name will be `lookup-table` with the primary key `hash_value` and provisoned my throughput to 1 Read and Write Capacity Unit. Which will enable us 4KB/s for reads and 1KB/s for writes.

For demonstration purposes, I am sharing my altered `ddb.json` file:

```json
{
    "AttributeDefinitions": [
        {
            "AttributeName": "hash_value",
            "AttributeType": "S"
        }
    ],
    "TableName": "lookup_table",
    "KeySchema": [
        {
            "AttributeName": "hash_value",
            "KeyType": "HASH"
        }
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 1,
        "WriteCapacityUnits": 1
    },
    "Tags": [
        {
            "Key": "Name",
            "Value": "lookup-table"
        }
    ]
}
```

Now that we have the file saved, create the dynamodb table:

```bash
$ aws dynamodb create-table --cli-input-json file://ddb.json
```

List the tables:

```bash
$ aws dynamodb list-tables
{
    "TableNames": [
        "lookup_table"
    ]
}
```

Check if the table is provisioned:

```bash
$ aws dynamodb describe-table --table-name lookup_table | jq -r '.Table.TableStatus'
ACTIVE
```

Getting the ARN string, as we will need it when we create our IAM Policy:

```bash
$ aws dynamodb describe-table --table-name lookup_table | jq -r '.Table.TableArn'
arn:aws:dynamodb:eu-west-1:x-x:table/lookup_table
```

## Create the OpenFaaS IAM User


Create the IAM Policy document which defines the access that we want to grant. You can see that we are only allowing Put and GetItem on the provisioned DynamoDB resource:

```bash
$ cat dynamodb-iam-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "OpenFaasFunctionAceessForDynamoDB",
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem"
            ],
            "Resource": "arn:aws:dynamodb:eu-west-1:x-accountid-x:table/lookup_table"
        }
    ]
}
```

Create the IAM Policy and provide the policy document for the given policy name:

```bash
$ aws iam create-policy --policy-name openfaas-dynamodb-access --policy-document file://dynamodb-iam-policy.json
{
    "Policy": {
        "PolicyName": "openfaas-dynamodb-access",
        "PolicyId": "ANPATPRT2G4SL4K63SUWQ",
        "Arn": "arn:aws:iam::x-accountid-x:policy/openfaas-dynamodb-access",
        "Path": "/",
        "DefaultVersionId": "v1",
        "AttachmentCount": 0,
        "PermissionsBoundaryUsageCount": 0,
        "IsAttachable": true,
        "CreateDate": "2019-07-06T11:54:26Z",
        "UpdateDate": "2019-07-06T11:54:26Z"
    }
}
```

Create the IAM User that will be used to authenticate requests against DynamoDB:

```bash
$ aws iam create-user --user-name openfaas-user
{
    "User": {
        "Path": "/",
        "UserName": "openfaas-user",
        "UserId": "AIDATPRT2G4SIRYTNHLZK",
        "Arn": "arn:aws:iam::x-accountid-x:user/openfaas-user",
        "CreateDate": "2019-07-06T11:56:53Z"
    }
}
```

Create the Access Key, which will be our API keys for our application to authenticate requests. Save the AccessKeyId and SecretAccessKey temporarily to 2 seperate files, which we will delete after we create our secrets to our cluster:

```bash
$ aws iam create-access-key --user-name openfaas-user
{
    "AccessKey": {
        "UserName": "openfaas-user",
        "AccessKeyId": "AKIAT..redacted.x",
        "Status": "Active",
        "SecretAccessKey": "b..redacted.x",
        "CreateDate": "2019-07-06T11:57:37Z"
    }
}
```

Associate the IAM Policy to the IAM User:

```bash
$ aws iam attach-user-policy --user-name openfaas-user --policy-arn arn:aws:iam::x-x:policy/openfaas-dynamodb-access
```

To test if the access keys work, save them to a new profile using the aws-cli tools:

```bash
$ aws configure --profile openfaas
AWS Access Key ID [None]: AKIAT..
AWS Secret Access Key [None]: b..x
Default region name [None]: eu-west-1
Default output format [None]: json
```

Write an Item to DynamoDB:


```bash
$ aws --profile openfaas dynamodb put-item \
--table-name lookup_table \
--item '{"hash_value": {"S": "aGVsbG8td29ybGQK"}, "message": {"S": "hello-world"}}'
```

Read the Item from DynamoDB:

```bash
$ aws --profile openfaas dynamodb get-item \
--table-name lookup_table \
--key '{"hash_value": {"S": "aGVsbG8td29ybGQK"}}'
{
    "Item": {
        "hash_value": {
            "S": "aGVsbG8td29ybGQK"
        },
        "message": {
            "S": "hello-world"
        }
    }
}
```

We can now confirm our permissions are in place to continue.

### Create OpenFaaS Secrets

The AccessKeyId and SecretKey has been saved to disk, and we will use those files to create secrets from:

```bash
$ faas-cli secret create openfaas-aws-access-key --from-file=openfaas_aws_access_key.txt
Creating secret: openfaas-aws-access-key
Created: 201 Created
```

```bash
$ faas-cli secret create openfaas-aws-secret-key --from-file=openfaas_aws_secret_key.txt
Creating secret: openfaas-aws-secret-key
Created: 201 Created
```

Now that the secrets are securely stored in our cluster, we can delete the temporary files:

```
$ rm -f ./openfaas_aws_*_key.txt
```

## Login to OpenFaaS


Login to OpenFaasS using faas-cli:

```bash
$ faas-cli login \
--gateway https://openfaas.domain.com \
--username ${OPENFAAS_USER} \
--password ${OPENFAAS_PASSWORD}
```

Export the OPENFAAS_URL:

```bash
$ export OPENFAAS_URL=https://openfaas.domain.com
```

## Create the Lookup Function:

Create a Python3 Function, and prefix it with your dockerhub user:

```bash
$ faas-cli new \
--lang python3 fn-dynamodb-lookup \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com
```

Open the stack file and set the environment variables:

```bash
$ cat fn-dynamodb-lookup.yml
provider:
  name: openfaas
  gateway: https://openfaas.domain.com
functions:
  fn-dynamodb-lookup:
    lang: python3
    handler: ./fn-dynamodb-lookup
    image: ruanbekker/fn-dynamodb-lookup:latest
    environment:
      dynamodb_region: eu-west-1
      dynamodb_table: lookup_table
```

The python code for our function:

```bash
$ cat fn-dynamodb-lookup/handler.py
```
```python
import json
import hashlib

def calc_sha(id_number, lastname):
    string = json.dumps({"id": id_number, "lastname": lastname}, sort_keys=True)
    hash_value = hashlib.sha1(string.encode("utf-8")).hexdigest()
    return hash_value

def handle(req):
    event = json.loads(req)
    hash_value = calc_sha(event['id'], event['lastname'])
    return hash_value
```

Build, ship and deploy your function:

```bash
$ faas-cli build -f fn-dynamodb-lookup.yml && \
faas-cli push -f fn-dynamodb-lookup.yml && \
faas-cli deploy -f fn-dynamodb-lookup.yml

Deploying: fn-dynamodb-lookup.
Deployed. 202 Accepted.
URL: https://openfaas.domain.com/function/fn-dynamodb-lookup
```

## Create the Write Function:

Create a Python3 Function, and prefix it with your dockerhub user:

```bash
$ faas-cli new \
--lang python3 fn-dynamodb-write \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com
```

Open the stack file and set the environment variables and include the secrets that was created:

```bash
$ cat fn-dynamodb-write.yml
provider:
  name: openfaas
  gateway: https://openfaas.domain.com
functions:
  fn-dynamodb-write:
    lang: python3
    handler: ./fn-dynamodb-write
    image: ruanbekker/fn-dynamodb-write:latest
    environment:
      dynamodb_region: eu-west-1
      dynamodb_table: lookup_table
    secrets:
      - openfaas-aws-access-key
      - openfaas-aws-secret-key
```

Our function relies on a external dependency which we need to install to interact with aws:

```bash
$ cat fn-dynamodb-write/requirements.txt
boto3
```

Our python code for our function:

```bash
$ cat fn-dynamodb-write/handler.py
```
```python
import boto3
import os
import json
import hashlib
import datetime

aws_key = open('/var/openfaas/secrets/openfaas-aws-access-key', 'r').read()
aws_secret = open('/var/openfaas/secrets/openfaas-aws-secret-key', 'r').read()
dynamodb_region = os.environ['dynamodb_region']
dynamodb_table  = os.environ['dynamodb_table']

client = boto3.Session(region_name=dynamodb_region).resource('dynamodb', aws_access_key_id=aws_key, aws_secret_access_key=aws_secret)
table = client.Table(dynamodb_table)

def calc_sha(id_number, lastname):
    string = json.dumps({"id": id_number, "lastname": lastname}, sort_keys=True)
    hash_value = hashlib.sha1(string.encode("utf-8")).hexdigest()
    return hash_value

def create_timestamp():
    response = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")
    return response

def handle(req):
    event = json.loads(req)
    unique_id = calc_sha(event['id'], event['lastname'])
    response = table.put_item(
        Item={
            'hash_value': unique_id,
            'timestamp': create_timestamp(),
            'payload': event['payload']
        }
    )
    return response
```

Build, ship and deploy your function:

```bash
$ faas-cli build -f fn-dynamodb-write.yml && \
faas-cli push -f fn-dynamodb-write.yml && \
faas-cli deploy -f fn-dynamodb-write.yml

Deploying: fn-dynamodb-write.
Deployed. 202 Accepted.
URL: https://openfaas.domain.com/function/fn-dynamodb-write
```

## Create the Get Function:

Create a Python3 Function, and prefix it with your dockerhub user:

```bash
$ faas-cli new \
--lang python3 fn-dynamodb-get \
--prefix=ruanbekker \
--gateway https://openfaas.domain.com
```

Open the stack file and set the environment variables and include the secrets that was created:

```bash
$ cat fn-dynamodb-get.yml
provider:
  name: openfaas
  gateway: https://openfaas.domain.com
functions:
  fn-dynamodb-get:
    lang: python3
    handler: ./fn-dynamodb-get
    image: ruanbekker/fn-dynamodb-get:latest
    environment:
      dynamodb_region: eu-west-1
      dynamodb_table: lookup_table
    secrets:
      - openfaas-aws-access-key
      - openfaas-aws-secret-key
```

Include the external dependency for aws:

```bash
$ cat fn-dynamodb-get/requirements.txt
boto3
```

Our python code for our function:

```bash
$ cat fn-dynamodb-get/handler.py
```
```python
import boto3
import os
import json

aws_key = open('/var/openfaas/secrets/openfaas-aws-access-key', 'r').read()
aws_secret = open('/var/openfaas/secrets/openfaas-aws-secret-key', 'r').read()
dynamodb_region = os.environ['dynamodb_region']
dynamodb_table  = os.environ['dynamodb_table']

client = boto3.Session(region_name=dynamodb_region).resource('dynamodb', aws_access_key_id=aws_key, aws_secret_access_key=aws_secret)
table = client.Table(dynamodb_table)

def handle(req):
    event = json.loads(req)
    response = table.get_item(
        Key={
            'hash_value': event['hash_value']
        }
    )

    if 'Item' not in response:
        item_data = 'Item not found'
    else:
        item_data = response['Item']

    return item_data
```

Build, ship and deploy:

```bash
$ faas-cli build -f fn-dynamodb-get.yml && \
faas-cli push -f fn-dynamodb-get.yml && \
faas-cli deploy -f fn-dynamodb-get.yml

Deploying: fn-dynamodb-get.
Deployed. 202 Accepted.
URL: https://openfaas.domain.com/function/fn-dynamodb-get
```

## Time for our Functions to interact with DynamoDB:

Write an Item to DynamoDB:

```bash
$ curl -XPOST https://openfaas.domain.com/function/fn-dynamodb-write -d '{"id": 8700000000001, "lastname": "smith", "payload": {"name": "james", "role": "reader"}}'
{'ResponseMetadata': {'RequestId': 'CNHEFHMSL4KGRDE0HRVQ69D5H7VV4KQNSO5AEMVJF66Q9ASUAAJG', 'HTTPStatusCode': 200, 'HTTPHeaders': {'server': 'Server', 'date': 'Sat, 06 Jul 2019 20:47:00 GMT', 'content-type': 'application/x-amz-json-1.0', 'content-length': '2', 'connection': 'keep-alive', 'x-amzn-requestid': 'CNHEFHMSL4KGRDE0HRVQ69D5H7VV4KQNSO5AEMVJF66Q9ASUAAJG', 'x-amz-crc32': '2745614147'}, 'RetryAttempts': 0}}
```

Write another Item to DynamoDB:

```bash
$ curl -XPOST https://openfaas.doamin.com/function/fn-dynamodb-write -d '{"id": 8700000000002, "lastname": "adams", "payload": {"name": "samantha", "role": "admin"}}'
{'ResponseMetadata': {'RequestId': 'KRQL838BVGC9LIUSCOUB7MOEQ7VV4KQNSO5AEMVJF66Q9ASUAAJG', 'HTTPStatusCode': 200, 'HTTPHeaders': {'server': 'Server', 'date': 'Sat, 06 Jul 2019 20:48:09 GMT', 'content-type': 'application/x-amz-json-1.0', 'content-length': '2', 'connection': 'keep-alive', 'x-amzn-requestid': 'KRQL838BVGC9LIUSCOUB7MOEQ7VV4KQNSO5AEMVJF66Q9ASUAAJG', 'x-amz-crc32': '2745614147'}, 'RetryAttempts': 0}}
```

Now recalculate the hash by passing the ID Number and Lastname to get the hash value for the primary key:

```bash
$ curl -XPOST https://openfaas.domain.com/function/fn-dynamodb-lookup -d '{"id": 8700000000002, "lastname": "adams"}'
bd0a248aff2b50b288ba504bd7142ef11b164901
```

Now that we have the hash value, do a GetItem by using the hash value in the request body:

```bash
$ curl -XPOST https://openfaas.domain.com/function/fn-dynamodb-get -d '{"hash_value": "bd0a248aff2b50b288ba504bd7142ef11b164901"}'
{'payload': {'name': 'samantha', 'role': 'admin'}, 'hash_value': 'bd0a248aff2b50b288ba504bd7142ef11b164901', 'timestamp': '2019-07-06T20:48'}
```

Note that the lookup function calculates a hash based on the input that you provide it, for example calculating a hash with userdata that does not exist in our table:

```bash
$ curl -XPOST https://openfaas.domain.com/function/fn-dynamodb-lookup -d '{"id": 8700000000003, "lastname": "williams"}'
c68dc272873140f4ae93bb3a3317772a6bdd9aa1
```

Using that hash value in our request body to read from dynamodb, will show us that the item has not been found:

```bash
$ curl -XPOST https://openfaas.domain.com/function/fn-dynamodb-get -d '{"hash_value": "c68dc272873140f4ae93bb3a3317772a6bdd9aa1"}'
Item not found
```

You might want to change this behavior but this is just for the demonstration of this post.

When you head over to DynamoDB's console you will see this in your table:

<img width="873" alt="image" src="https://user-images.githubusercontent.com/567298/60761025-9e8e7c80-a040-11e9-83a3-ad5b474a28ff.png">

## Thanks

This was a basic example using OpenFaaS with Amazon DynamoDB with Python and secrets managed with OpenFaas. I really like the way OpenFaaS let's you work with secrets, it works great and don't need an additional resource to manage your sensitive data.

Although this was basic usage with OpenFaaS and DynamoDB, the sky is the limit what you can do with it. 

## Resources:

- [DynamoDB: Choosing the right Partition Key](https://aws.amazon.com/blogs/database/choosing-the-right-dynamodb-partition-key/)
- [Designing Partition Keys to Distribute Your Workload Evenly](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-uniform-load.html)
- [OpenFaaS: Getting Started](https://docs.openfaas.com/contributing/get-started/)
- [OpenFaaS: Secrets](https://docs.openfaas.com/reference/secrets/)
