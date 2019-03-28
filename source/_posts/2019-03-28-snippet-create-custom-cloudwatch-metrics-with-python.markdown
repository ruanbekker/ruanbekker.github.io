---
layout: post
title: "Snippet: Create Custom CloudWatch Metrics with Python"
date: 2019-03-28 08:05:28 -0400
comments: true
categories: ["cloudwatch", "boto3", "python", "aws", "metrics", "snippets"] 
---

![](https://user-images.githubusercontent.com/567298/53865781-a984c200-3ff8-11e9-9ffa-ccad62ac08f6.png)

A quick post on how create custom CloudWatch Metrics using Python on AWS.

After you produced the metrics into CloudWatch, you will be able to see them when navigating to:

- CloudWatch / Metrics / Custom Namespaces / statusdash/ec2client

When selecting:

```
Select Metric: SomeKey1, SomeKey2
Select MetricName HttpResponseTime
```

And should look like this:

![](https://user-images.githubusercontent.com/567298/53865426-d4224b00-3ff7-11e9-8bd5-bd04dfdd9f43.png)

## The Script:

The python script that will be using boto3 to talk to AWS:

```python
import boto3
import random
cloudwatch = boto3.Session(region_name='eu-west-1').client('cloudwatch')
response = cloudwatch.put_metric_data(
MetricData = [
    {
        'MetricName': 'HttpResponseTime',
        'Dimensions': [
            {
                'Name': 'Server',
                'Value': 'app.example.com'
            },
            {
                'Name': 'Client',
                'Value': 'Client-ABC'
            },
        ],
        'Unit': 'Milliseconds',
        'Value': random.randint(20, 50)
    },
],
Namespace = 'statusdash/ec2client'
)
print response
```

## Resources:

https://stackify.com/custom-metrics-aws-lambda/
https://www.syntouch.nl/custom-cloudwatch-metrics-in-python-yes-we-can/ <- psutil
https://aws.amazon.com/blogs/devops/new-how-to-better-monitor-your-custom-application-metrics-using-amazon-cloudwatch-agent/
https://medium.com/@mrdoro/aws-lambda-as-the-website-monitoring-tool-184b09202ae2

