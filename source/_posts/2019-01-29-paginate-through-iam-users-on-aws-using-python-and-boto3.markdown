---
layout: post
title: "Paginate through IAM Users on AWS using Python and Boto3"
date: 2019-01-29 10:03:24 -0500
comments: true
categories: ["aws", "iam", "python", "boto3"] 
---

When listing AWS IAM Users in Boto3, you will find that not all the users are retrieved. This is because they are paginated.

To do a normal list_users api call:

```python
>>> import boto3
>>> iam = boto3.Session(region_name='eu-west-1', profile_name='default').client('iam')
>>> len(iam.list_users()['Users'])
100
```

Although I know there's more than 200 users. Therefore we need to paginate through our users:

```python
>>> import boto3
>>> iam = boto3.Session(region_name='eu-west-1', profile_name='default').client('iam')
>>> paginator = iam.get_paginator('list_users')
>>> users = []
>>> all_users = []
>>> for response in paginator.paginate():
...     users.append(response['Users'])
...
>>> len(users)
3

>>> for iteration in xrange(len(users)):
...     for userobj in xrange(len(users[iteration])):
...         all_users.append((users[iteration][userobj]['UserName']))
...
>>> len(all_users)
210
```

For more information on this, have a look at AWS Documentation about [Pagination](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/paginators.html)
