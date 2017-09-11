---
layout: post
title: "Using Python for Image Analysis with Amazons Rekognition Service"
date: 2017-09-11 10:20:28 -0400
comments: true
categories: ["aws", "python", "boto3", "rekognition", "deep-learning", "ai"] 
---

Amazon's Rekognition Service, which falls under their Artificial Intelligence tier, makes it easy to add image analysis to your applications.

Today we will use Rekognition to analyze an image, to determine the percentage of detection that the service analyzes. We will be using the Python SDK to do this.

## Getting a Random Image:

So, I got this drunk guy on the couch, which I thought we could use to analyze.

Image Used:
- http://imgur.com/a/CHnSu

<blockquote class="imgur-embed-pub" lang="en" data-id="a/CHnSu"><a href="//imgur.com/CHnSu"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>

## Our Python Code:

Our code will use boto3 to use rekognition from Amazon Web Services, detects the image, and prints out the values.

Note that I am not specifying any credentials, as my credentials is configured in my local credential provider, where boto will pick it up from.

```python
import boto3

BUCKET = "rekognition-bucket"
KEY = "images/image-02.jpg"

def detect_labels(bucket, key, max_labels=10, min_confidence=90, region="eu-west-1", profile_name="aws"):
    rekognition = boto3.client("rekognition")
    response = rekognition.detect_labels(
        Image={
        "S3Object": {
        "Bucket": BUCKET,
        "Name": KEY,
    }
        },
        MaxLabels=max_labels,
        MinConfidence=min_confidence,
    )
    return response['Labels']
 
 
for label in detect_labels(BUCKET, KEY):
    print("{Name} - {Confidence}%".format(**label))
```

## Running the App:

Running our Python App, will result in the following:

```bash
$ python rekog.py 
People - 98.9893875122%
Person - 98.9893951416%
Human - 98.9505844116%
Alcohol - 98.573425293%
Beer - 98.573425293%
Beer Bottle - 98.573425293%
Beverage - 98.573425293%
Bottle - 98.573425293%
Drink - 98.573425293%
Couch - 98.4713821411%
```

## Resources:

- https://aws.amazon.com/rekognition/
- https://gist.github.com/alexcasalboni/0f21a1889f09760f8981b643326730ff

<center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
