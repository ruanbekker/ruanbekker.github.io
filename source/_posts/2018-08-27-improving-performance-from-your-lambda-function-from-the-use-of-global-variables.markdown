---
layout: post
title: "Improving Performance from your Lambda Function from the use of Global Variables"
date: 2018-08-27 08:30:30 -0400
comments: true
categories: ["aws", "dynamodb", "lambda", "caching", "performance", "python"] 
---

![](https://objects.ruanbekker.com/assets/images/aws-logo.png)

When using Lambda and DynamoDB, you can use global variables to gain performance when your data from DynamoDB does not get updated that often, and you would like to use caching to prevent a API call to DynamoDB everytime your Lambda Function gets invoked.

You can use external services like Redis or Memcached when you would like to verify that each invocation is as true as your source of truth which will be DynamoDB. Then your application logic can work with caching. 

But in this case we just want a simple piece of code that can keep the state for the remaining time that the function is running on that underlying container. I am not 100% sure, but I have seen that the data can be cached for up to 60 minutes. This can be a total mess when your data gets updated regularly, then I would set all my calls in functions, as the global variables keeps their state for some time.

## Example Function:

This function gets data from DynamoDB, iterates through a small dataset (10 Items), and appends each group name to my list which is the value of my `groups` key inside my dictionary.

Due to my global variable `mydata`, you will see that the first invocation will result in a API call to DynamoDB as the length of my `mydata["groups"]` being 0, the second invocation, the data will exist inside my global variable, therefore I am returning the data directly from my variable.

```python
import boto3, json

client = boto3.resource('dynamodb', region_name='eu-west-1')
tbl = client.Table('my-dynamo-table')

mydata = {}
mydata["groups"] = []

def lambda_handler(event, context):
    if len(mydata["groups"]) == 0:
        # data is not cached, make call to dynamo
        data = tbl.scan()
        group_data = data['Items']

        for group in group_data:
            mydata["groups"].append(group['name'])
        return mydata

    else:
        # return cached content
        return mydata
```

## Results of my Invocations:

The first call that I made:

![](https://objects.ruanbekker.com/assets/images/lambda-caching-miss.png)

The second call that I made:

![](https://objects.ruanbekker.com/assets/images/lambda-caching-hit.png)

If you need a small layer of caching that can improve your latency, this can be used. But if you need your data to be accurate from every call, rather looking into a different approach and external caching services.

## Resources:

*Take advantage of Execution Context reuse to improve the performance of your function.*:

"Make sure any externalized configuration or dependencies that your code retrieves are stored and referenced locally after initial execution. Limit the re-initialization of variables/objects on every invocation. Instead use static initialization/constructor, global/static variables and singletons. Keep alive and reuse connections (HTTP, database, etc.) that were established during a previous invocation."

- https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/
