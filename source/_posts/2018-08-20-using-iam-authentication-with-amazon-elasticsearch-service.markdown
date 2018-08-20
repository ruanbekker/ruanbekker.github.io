---
layout: post
title: "Using IAM Authentication with Amazon Elasticsearch Service"
date: 2018-08-20 04:12:21 -0400
comments: true
categories: ["elasticsearch", "aws", "amazon", "iam", "authentication", "security", "python"] 
---

Today I will demonstrate how to allow access to Amazons Elasticsearch Service using IAM Authenticationi using AWS Signature Version4.

## Elasticsearch Service Authentication Support:

When it comes to security, Amazons Elasticsearch Service supports three types of access policies:

- Resource Based
- Identity Based
- IP Access Based

More information on this can be found below:
- https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-ac.html

## Securing your Amazon Elasticsearch Search Domain:

To secure your domain with IAM Based Authentication, the following steps will be neeed:

- Create IAM Policy to be associated with a IAM User or Role
- On Elasticsearch Access Policy, associate the ARN to the Resource
- Use the AWS4Auth package to sign the requests as AWS supports Signature Version 4

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "es:*"
            ],
            "Resource": "arn:aws:es:eu-west-1:<ACCOUNT-ID>:domain/<ES-DOMAIN>"
        }
    ]
}
```

Create the IAM Role with EC2 Identity Provider as a Trusted Relationship eg. es-role and associate the IAM Policy es-policy to the role.

Create/Moodify the Elasticsearch Access Policy, in this example we will be using a combination of IAM Role, IAM User and IP Based access:

- IAM Role for EC2 Role Based Services
- IAM User for User/System Account
- IP Based for cients that needs to be whitelisted via IP (ip-based just for demonstration, as the tests will be used only for IAM)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::<ACCOUNT-ID>:role/<IAM-ROLE-NAME>",
          "arn:aws:iam::<ACCOUNT-ID>:user/<IAM-USER-NAME>"
        ]
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:eu-west-1:<ACCOUNT-ID>:domain/<ES-DOMAIN>/*"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:eu-west-1:<ACCOUNT-ID>:domain/<ES-DOMAIN>/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "x.x.x.x",
            "x.x.x.x"
          ]
        }
      }
    }
  ]
}
```

After the Access Policy has been updated, the Elasticsearch Domain Status will show `Active`

## Testing from EC2 using IAM Instance Profile:

Launch a EC2 Instance with the IAM Role eg. es-role, then using Python, we will make a request to our Elasticsearch Domain using boto3, aws4auth and the native elasticsearch client for python via our IAM Role, which we will get the temporary credentials from boto3.Session:

```python
import boto3, json
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
 
my_region = 'eu-west-1'
my_servuce = 'es'
my_eshost = 'search-replaceme.eu-west-1.es.amazonaws.com'
 
session = boto3.Session(region_name='eu-west-1')
credentials = session.get_credentials()
credentials = credentials.get_frozen_credentials()
access_key = credentials.access_key
secret_key = credentials.secret_key
token = credentials.token
 
aws_auth = AWS4Auth(
    access_key,
    secret_key,
    my_region,
    my_service,
    session_token=token
)
 
es = Elasticsearch(
    hosts = [{'host': my_eshost, 'port': 443}],
    http_auth=aws_auth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)
 
print(json.dumps(es.info(), indent=2))
```

Running our piece of code, will result in this:

```bash
$ python get-info-from-role.py
{
  "cluster_name": "<ACCOUNT-ID>:<ES-DOMAIN>",
  "cluster_uuid": "sLUnqFSsQdCMlBLrn7BTUA",
  "version": {
    "lucene_version": "6.6.0",
    "build_hash": "Unknown",
    "build_snapshot": false,
    "number": "5.5.2",
    "build_date": "2017-10-18T04:35:01.381Z"
  },
  "name": "KXSwBvT",
  "tagline": "You Know, for Search"
}
```

## Testing using IAM Credentials from Credentials Provider:

Configure your credentials provider:

```bash
$ pip install awscli
$ aws configure --profile ruan
AWS Access Key ID [None]: xxxxxxxxx
AWS Secret Access Key [None]: xxxxxx
Default region name [None]: eu-west-1
Default output format [None]: json
```

Using Python, we will get the credentials from the Credential Provider, using our profile name:

```python
import boto3, json
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
 
my_service = 'es'
my_region = 'eu-west-1'
my_eshost = 'search-replaceme.eu-west-1.es.amazonaws.com'
 
session = boto3.Session(
    region_name='eu-west-1',
    profile_name='ruan'
)
 
credentials = session.get_credentials()
access_key = credentials.access_key
secret_key = credentials.secret_key
 
aws_auth = AWS4Auth(
    access_key,
    secret_key,
    my_region,
    my_service
)
 
es = Elasticsearch(
    hosts = [{'host': my_eshost, 'port': 443}],
    http_auth=aws_auth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)
 
print(json.dumps(es.info(), indent=2))
```

Running it will result in:

```bash
$ python get-info-from-user.py
{
  "cluster_name": "<ACCOUNT-ID>:<ES-DOMAIN>",
  "cluster_uuid": "sLUnqFSsQdCMlBLrn7BTUA",
  "version": {
    "lucene_version": "6.6.0",
    "build_hash": "Unknown",
    "build_snapshot": false,
    "number": "5.5.2",
    "build_date": "2017-10-18T04:37:21.381Z"
  },
  "name": "KXSwBvT",
  "tagline": "You Know, for Search"
}
```

For more blog posts on Elasticsearch have a look at:
- [blog.ruanbekker.com:elasticsearch](http://blog.ruanbekker.com/blog/categories/elasticsearch) 
- [sysadmins.co.za:elasticsearch](https://sysadmins.co.za/tags/elasticsearch)
