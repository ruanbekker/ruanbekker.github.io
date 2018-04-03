---
layout: post
title: "Using Python Boto3 and DreamHosts DreamObjects to Interact with their Object Storage Offering"
date: 2018-04-03 07:19:27 -0400
comments: true
categories: ["dreamhost", "python", "boto3", "s3", "object-storage"] 
---

![](https://i.snag.gy/uxK5qy.jpg)

In this post I will demonstrate how to interact with Dreamhost's Object Storage Service Offering called DreamObjects using Python Boto3 library. Dreamhost offers Object Storage at great pricing, for more information have a look at their [Documentation](https://goo.gl/N7Xws8)

## Whats on the Menu:

We will do the following:

- List Buckets
- List Objects
- Put Object
- Get Object
- Upload Object
- Download Object
- Delete Object(s)

## Configuration 

First we need to configure credentials, by providing the access key and access secret key, that is provided by DreamHost:

```bash
$ pip install awscli
$ aws configure --profile dreamhost
```

After your credentials is set to your profile, we will need to import boto3 and instantiate the s3 client with our profile name, region name and endpoint url:

```python
>>> import boto3
>>> session = boto3.Session(region_name='us-west-2', profile_name='dreamhost')
>>> s3 = session.client('s3', endpoint_url='https://objects-us-west-1.dream.io')
```

## List Buckets:

To list our Buckets:

```
>>> response = s3.list_buckets()
>>> print(response)
{u'Owner': {u'DisplayName': 'foobar', u'ID': 'foobar'}, u'Buckets': [{u'CreationDate': datetime.datetime(2017, 4, 15, 21, 51, 3, 921000, tzinfo=tzutc()), u'Name': 'ruanbucket'}], 'ResponseMetadata': {'HTTPStatusCode': 200, 'RetryAttempts': 0, 'HostId': '', 'RequestId': 'tx00000000000000003cd88-005ac361f5-foobar-default', 'HTTPHeaders': {'date': 'Tue, 03 Apr 2018 11:13:57 GMT', 'content-length': '306', 'x-amz-request-id': 'tx00000000000000003cd88-005ac361f5-foobar-default', 'content-type': 'application/xml'}}}

>>> for bucket in response['Buckets']:
...     print(bucket['Name'])
...
ruanbucket
```

## List Objects:

List all the Objects, after the given prefix: 

```python
>>> response = s3.list_objects(Bucket='ruanbucket', Prefix='logs/sysadmins.co.za/access/')
>>> for obj in response['Contents']:
...     print obj['Key']
...
logs/sysadmins.co.za/access/access.log-2017-10-10.gz
logs/sysadmins.co.za/access/access.log-2017-10-11.gz
logs/sysadmins.co.za/access/access.log-2017-10-12.gz
```

## Put Object:

Write text as the body to the destination key on the Bucket:

```python
>>> response = s3.put_object(Bucket='ruanbucket', Body='My Name is Ruan\n', Key='uploads/docs/file.txt')
>>> print(response)
{u'Body': <botocore.response.StreamingBody object at 0x13cde10>, u'AcceptRanges': 'bytes', u'ContentType': 'binary/octet-stream', 'ResponseMetadata': {'HTTPStatusCode': 200, 'RetryAttempts': 0, 'HostId': '', 'RequestId': 'tx0000000000000000053f2-005ac3e0db-foobar-default', 'HTTPHeaders': {'content-length': '16', 'accept-ranges': 'bytes', 'last-modified': 'Tue, 03 Apr 2018 20:14:54 GMT', 'etag': '"292edceea84d1234465f725c3921fc2a"', 'x-amz-request-id': 'tx0000000000000000053f2-005ac3e0db-foobar-default', 'date': 'Tue, 03 Apr 2018 20:15:23 GMT', 'content-type': 'binary/octet-stream'}}, u'LastModified': datetime.datetime(2018, 4, 3, 20, 14, 54, tzinfo=tzutc()), u'ContentLength': 16, u'ETag': '"292edceea84d1234465f725c3921fc2a"', u'Metadata': {}}
```

List the Object that we have created in the Bucket::

```python
>>> response = s3.list_objects(Bucket='ruanbucket', Prefix='uploads/')
>>> for obj in response['Contents']:
...     print obj['Key']
...
uploads/docs/file.txt
```

## Get Object:

Read the value from the key that was uploaded:

```python
>>> response = s3.get_object(Bucket='ruanbucket', Key='uploads/docs/file.txt')
>>> print(response['Body'].read())
My Name is Ruan

```

## Upload Files:

Upload the file from disk to the Bucket:

```python
>>> with open('myfile.txt', 'rb') as data:
...     s3.upload_fileobj(Fileobj=data, Bucket='ruanbucket', Key='uploads/docs/uploadobj.txt')
...
```

Read the contents from the uploaded file:

```python
>>> response = s3.get_object(Bucket='ruanbucket', Key='uploads/docs/uploadobj.txt')
>>> print(response['Body'].read())
This is some text
```

## Download File:

Download the file from the Bucket to the local disk:

```python
>>> with open('downloaded.txt', 'wb') as data:
...     s3.download_fileobj(Bucket='ruanbucket', Key='uploads/docs/uploadobj.txt', Fileobj=data)
...
```

Read the file's content from disk:

```python
>>> print(open('downloaded.txt').read())
This is some text
```

## Delete Object:

Delete one object:

```python
>>> response = s3.delete_object(Bucket='ruanbucket', Key='uploads/docs/uploadobj.txt')
>>> print(response)
{'ResponseMetadata': {'HTTPStatusCode': 204, 'RetryAttempts': 0, 'HostId': '', 'RequestId': 'tx00000000000000000be5a-005ac3e61a-foobar-default', 'HTTPHeaders': {'date': 'Tue, 03 Apr 2018 20:37:46 GMT', 'x-amz-request-id': 'tx00000000000000000be5a-005ac3e61a-foobar-default'}}}
```

## Delete Objects:

Delete more than one object with a single API call:

```python
>>> response = s3.delete_objects(Bucket='ruanbucket', Delete={'Objects': [{'Key': 'uploads/docs/file.txt'}, {'Key': 'uploads/docs/file2.txt'}, {'Key': 'uploads/docs/file3.txt'}]})
>>> print(response)
{u'Deleted': [{u'Key': 'uploads/docs/file.txt'}, {u'Key': 'uploads/docs/file2.txt'}, {u'Key': 'uploads/docs/file3.txt'}], 'ResponseMetadata': {'HTTPStatusCode': 200, 'RetryAttempts': 0, 'HostId': '', 'RequestId': 'tx000000000000000011008-005ac3e951-foobar-default', 'HTTPHeaders': {'date': 'Tue, 03 Apr 2018 20:51:29 GMT', 'content-length': '270', 'x-amz-request-id': 'tx000000000000000011008-005ac3e951-217c0ac5-default', 'content-type': 'application/xml'}}}
```

For more information on the above, have a look at [Boto's Documentation](http://boto3.readthedocs.io/en/latest/guide/quickstart.html) and [DreamHost's Website](https://www.dreamhost.com/)
