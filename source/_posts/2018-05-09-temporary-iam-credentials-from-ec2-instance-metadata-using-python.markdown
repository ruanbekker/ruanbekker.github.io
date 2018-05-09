---
layout: post
title: "Temporary IAM Credentials from EC2 Instance Metadata using Python"
date: 2018-05-09 12:14:11 -0400
comments: true
categories: ["aws", "ec2". "iam", "security", "python", "boto3", "dynamodb", "credentials"] 
---

From a Best Practice Perspective its good not having to pass sensitive information around, and especially not hard coding them.

## Best Practice: Security

One good way is to use SSM with KMS to Encrypt/Decrypt them, but since EC2 has a [Metadata Service](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) available, we can make use of that to retrieve [temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html). One requirement though, is that the instance will require an IAM Role where the code will be executed on. The IAM Role also needs to have sufficient privileges to be able to execute, whatever you need to do.

The [12 Factor](https://12factor.net/) Methodology however states to use config in your environment variables, but from the application logic, its easy to save it in our environment.

## Scenario: Applications on AWS EC2

When you run applications on Amazon EC2 the nodes has access to the EC2 Metadata Service, so in this case our IAM Role has a Policy that authorizes GetItem on our DynamoDB table, therefore we can define our code with no sensitive information, as the code will do all the work to get the credentials and use the credentials to access DynamoDB.

## Use Temporary Credentials to Read from DynamoDB

In this example we will get the temporary credentials from the metadata service, then define the temporary credentials in our session to authorize our request against dynamodb to read from our table:

```python
>>> import boto3
>>> from botocore.utils import InstanceMetadataFetcher
>>> from botocore.credentials import InstanceMetadataProvider
>>> provider = InstanceMetadataProvider(iam_role_fetcher=InstanceMetadataFetcher(timeout=1000, num_attempts=2))
>>> creds = provider.load()
 
>>> session = boto3.Session(
    aws_access_key_id=creds.access_key,
    aws_secret_access_key=creds.secret_key,
    aws_session_token=creds.token
)
 
>>> ddb = session.client('dynamodb')
 
>>> response = ddb.get_item(
    TableName='my-dynamodb-table',
    Key={
        'node_type': {
            'S': 'primary_manager'
        }
    }
)
 
>>> print(response['Item']['ip']['S'])
'10.0.0.32
```

Also, when you are logged onto the EC2 instance, you can use curl to see the temporary credentials information:

```bash
$ iam_role_name=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
$ curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/${iam_role_name}
{
  "Code" : "Success",
  "LastUpdated" : "2018-05-09T14:25:48Z",
  "Type" : "AWS-HMAC",
  "AccessKeyId" : "",
  "SecretAccessKey" : "",
  "Token" : "",
  "Expiration" : "2018-05-09T20:46:55Z"
}
```
