---
layout: post
title: "How to Setup a Serverless URL Shortener with API Gateway Lambda and DynamoDB on AWS"
date: 2018-11-30 02:51:24 -0500
comments: true
categories: ["aws", "serverless", "api-gateway", "lambda", "dynamodb", "python"] 
---
![](https://objects.ruanbekker.com/assets/images/aws-logo.png)

Today we will set a Serverless URL Shortener using API Gateway, Lambda with Python and DynamoDB.

## Overview 

The service that we will be creating, will shorten URLs via our API which will create an entry on DynamoDB. When a GET method is performed on the shortened URL, a GetItem is executed on DynamoDB to get the Long URL and a 301 Redirect is performed to redirect the client to intended destination URL.

Note, I am using a domain name which is quite long, but its only for demonstration, if you can get hold of any short domains like `t.co` etc, that will make your Shortened URLs really short in character count. 

## The Setup

The following services will be used to create a URL Shortener:

- AWS API Gateway: ( `/create`: to create a shortened url and `/t/{id}` to redirect to long url)
- AWS IAM: (Role and Policy for Permissions to call DynamoDB from Lambda)
- AWS Lambda: (Application Logic)
- AWS DynamoDB: (Persistent Store to save our Data)
- AWS ACM: (Optional: Certificate for your Domain)
- AWS Route53: (Optional: DNS for the domain that you want to associate to your API)

The flow will be like the following:

- POST Request gets made to the `/create` request path with the `long_url` data in the payload 
- This data is then used by the Lambda function to create a short url and create a entry in DynamoDB
- In DynamoDB the entry is created with the short id as the hash key and the long url as one of the attributes
- The response to the client will be the short url
- When a GET method is performed on the id eg `/t/{short_id}`, a lookup gets done on the DynamoDB table, retrieves the long url from the table
- A 301 redirect gets performed on API Gateway and the client gets redirected to the intended url

## Creating the URL Shortener

After completing this tutorial you will have your own Serverless URL Shortener using API Gateway, Lambda and DynamoDB.

## IAM Permissions

On AWS IAM, create a IAM Policy, in my case the policy name is `lambda-dynamodb-url-shortener` and note that I masked out my account number:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:eu-west-1:xxxxxxxxxxxx:table/url-shortener-table"
        }
    ]
}
```

Head over to [IAM Roles](https://console.aws.amazon.com/iam/home?region=eu-west-1#/roles), select Create Role, Select Lambda as the Trusted Entitiy from the AWS Service section, go ahead with the permissions and select your IAM Policy that was created, in my case `lambda-dynamodb-url-shortener` and `AWSLambdaBasicExecution` role. Give your Role a name, in my case `lambda-dynamodb-url-shortener-role`.

## DynamoDB Table

Next, head over to [DynamoDB](https://eu-west-1.console.aws.amazon.com/dynamodb/home?region=eu-west-1#create-table:) create a table, in my case the table name: `url-shortener-table` and the primary key `short_id` set to string:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-02.png)

## Lambda Functions

Once the table is created, head over to [Lambda](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/create?firstrun=true) and create a Lambda function, in my case using Python 3.6 and provide a name, where I used: `url-shortener-create` and select the IAM role from the previous role that we created, this function will be the lambda function that will create the shortened urls:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-03-lambda.png)

The code for your lambda function which will take care of creating the short urls and save them to dynamodb, take note on the region and table name to ensure that it matches your setup:

```python
import os
import json
import boto3
from string import ascii_letters, digits
from random import choice, randint
from time import strftime, time
from urllib import parse

app_url = os.getenv('APP_URL')
min_char = int(os.getenv('MIN_CHAR'))
max_char = int(os.getenv('MAX_CHAR'))
string_format = ascii_letters + digits

ddb = boto3.resource('dynamodb', region_name = 'eu-west-1').Table('url-shortener-table')

def generate_timestamp():
    response = strftime("%Y-%m-%dT%H:%M:%S")
    return response

def expiry_date():
    response = int(time()) + int(604800)
    return response

def check_id(short_id):
    if 'Item' in ddb.get_item(Key={'short_id': short_id}):
        response = generate_id()
    else:
        return short_id

def generate_id():
    short_id = "".join(choice(string_format) for x in range(randint(min_char, max_char)))
    print(short_id)
    response = check_id(short_id)
    return response

def lambda_handler(event, context):
    analytics = {}
    print(event)
    short_id = generate_id()
    short_url = app_url + short_id
    long_url = json.loads(event.get('body')).get('long_url')
    timestamp = generate_timestamp()
    ttl_value = expiry_date()
    
    analytics['user_agent'] = event.get('headers').get('User-Agent')
    analytics['source_ip'] = event.get('headers').get('X-Forwarded-For')
    analytics['xray_trace_id'] = event.get('headers').get('X-Amzn-Trace-Id')
    
    if len(parse.urlsplit(long_url).query) > 0:
        url_params = dict(parse.parse_qsl(parse.urlsplit(long_url).query))
        for k in url_params:
            analytics[k] = url_params[k]

    response = ddb.put_item(
        Item={
            'short_id': short_id,
            'created_at': timestamp,
            'ttl': int(ttl_value),
            'short_url': short_url,
            'long_url': long_url,
            'analytics': analytics,
            'hits': int(0)
        }
    )
    
    return {
        "statusCode": 200,
        "body": short_url
    }
```

Set a couple of environment variables that will be used in our function, min and max chars from the screenshot below is the amount of characters that will be used in a random manner to make the short id unique. The app_url will be your domain name, as this will be returned to the client with the short id eg. `https://tiny.myserverlessapp.net/t/3f8Hf38n398t` :

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-04-lambda.png)

While you are on Lambda, create the function that will retrieve the long url, in my case `url-shortener-retrieve`:

```python
import os
import json
import boto3

ddb = boto3.resource('dynamodb', region_name = 'eu-west-1').Table('eng-url-shortener')

def lambda_handler(event, context):
    short_id = event.get('short_id')
    
    try:
        item = ddb.get_item(Key={'short_id': short_id})
        long_url = item.get('Item').get('long_url')
        # increase the hit number on the db entry of the url (analytics?)
        ddb.update_item(
            Key={'short_id': short_id},
            UpdateExpression='set hits = hits + :val',
            ExpressionAttributeValues={':val': 1}
        )
    
    except:
        return {
            'statusCode': 301,
            'location': 'https://objects.ruanbekker.com/assets/images/404-blue.jpg'
        }
    
    return {
        "statusCode": 301,
        "location": long_url
    }
```

## API Gateway

Head over to [API Gateway](https://console.aws.amazon.com/apigateway/home?region=us-east-1#/apis) and create your API, in my case `url-shortener-api` 

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-05-api-gateway.png)

Head over to Resources:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-06-api-gateway.png)

and create a new resource called `/create`:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-07-api-gateway.png)

Once the resource is created, create a post method on the `create` resource and select Lambda as the integration type and lambda proxy integration as seen below:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-09-api-gateway.png)

Once you save it, it will ask to give api gateway permission to invoike your lambda function wich you can accept by hitting ok as below:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-10-iam-permission.png)

When you look at the POST method on your create resource, it should look like this:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-12-api-gateway.png)

Select the root resource `/` and from Actions create a new resource `/t`:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-13-api-gateway.png)

Select the `/t` resource and create a new resource named `shortid` and provide `{shortid}` in the resource path as this will be the data that will be proxied through to our lambda function:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-14-api-gateway.png)

Create a GET method on the `/t/{shortid}` resource and select `url-shortener-retrieve` lambda function as the function from the lambda integration selection as seen below:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-17-api-gateway.png)

Again, grant api gateway permission to invoke your function:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-18-iam-permission.png)

When you select the GET method, it should look like this:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-19-api-gateway.png)

Select the Integration Request and head over to Mapping Templates:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-20-api-gateway.png)

from the Request body passtrhough, add a mapping template `application/json` and provide the following mapping template:


```
{
    "short_id": "$input.params('shortid')"
}
```

On the Method Response:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-21-api-gateway.png)

Delete the 200 HTTP Status Response and create a new response by "Add Response", add `301` HTTP Status, add `Location` Header to the response.

Navigate to the Integration Response from the `/{shortid}` GET method:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-21-api-gateway.png)

delete the 200 HTTP Response, add "integration response", set method response status to 301 and add header mapping for location to integration.response.body.location as below:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-23-api-gateway.png)

make sure to select the integration response to - so that the method response reflects to 301:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-24-api-gateway.png)

Navigate to Actions and select "Deploy API", select your stage, in my case `test` and deploy:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-25-api-gateway.png)

Go to stages, select your stage, select the post request to reveal the API URL:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-26-api-gateway.png)

Time to test out the URL Shortener:

```bash
curl -XPOST -H "Content-Type: application/json" https://xxxxxx.execute-api.eu-west-1.amazonaws.com/test/create -d '{"long_url": "https://www.google.com/search?q=helloworld"}'
https://tiny.myserverlessapp.net/t/pcnWoCGCr2ad1x
```

## ACM Certificates

At this moment we dont have our domain connected with our API Gateway, and we would also want a certificate on our application, which we can use ACM to request a certificate that can be associated to our domain. So in order to do that, first request a certificate on [ACM](https://eu-west-1.console.aws.amazon.com/acm/home?region=eu-west-1#/privatewizard/). Select Request a certificate, create a wildcard entry: `*.yourdomain.com`, select DNS Validation (If you host with Route53, they allow you the option to create the record).

Head back to API Gateway to associate the Domain and ACM Certificate to our API:

From the "Custom Domain Names" section, create a custom domain name, once you selected regional, it will ask for the target domain name, which will be the resolved to your API Endpoint that was created, and from the "Base Path Mappings" section, select `/` as the path to your API stage, in my case `url-shortener-api:test`:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-28-api-gateway.png)

## Route 53

Last part is to create a Route53 entry for tiny.yourdomain.com to resolve to the CNAME value of the target domain name that was provided in the custom domain names section:

![](https://objects.ruanbekker.com/assets/images/tiny-url-setup-29-route53.png)

## Demo the URL Shortener Service:

Once everything is setup we can test, by creating a Shortened URL:

```bash
$ curl -XPOST -H "Content-Type: application/json" https://tiny.myserverlessapp.net/create -d '{"long_url": "https://www.google.com/search?q=helloworld"}'
https://tiny.myserverlessapp.net/t/p7ISNcxTByXhN
```

Testing out the Short URL to redirect to the Destination URL:

```bash
$ curl -ivL https://tiny.myserverlessapp.net/t/p7ISNcxTByXhN
*   Trying 34.226.10.0...
* TCP_NODELAY set
* Connected to tiny.myserverlessapp.net (34.226.10.0) port 443 (#0)
* TLS 1.2 connection using TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
* Server certificate: *.myserverlessapp.net
* Server certificate: Amazon
* Server certificate: Amazon Root CA 1
* Server certificate: Starfield Services Root Certificate Authority - G2
> GET /t/p7ISNcxTByXhN HTTP/1.1
> Host: tiny.myserverlessapp.net
> User-Agent: curl/7.54.0
> Accept: */*
>
< HTTP/1.1 301 Moved Permanently
HTTP/1.1 301 Moved Permanently
< Date: Tue, 29 Nov 2018 00:05:02 GMT
Date: Tue, 29 Nov 2018 00:05:02 GMT
< Content-Type: application/json
Content-Type: application/json
< Content-Length: 77
Content-Length: 77
< Connection: keep-alive
Connection: keep-alive
< x-amzn-RequestId: f79048c8-cb56-41e8-b21d-b45fac47453a
x-amzn-RequestId: f79048c8-cb56-41e8-b21d-b45fac47453a
< x-amz-apigw-id: OeKPHH7_DoEFdjg=
x-amz-apigw-id: OeKPHH7_DoEFdjg=
< Location: https://www.google.com/search?q=helloworld
Location: https://www.google.com/search?q=helloworld
```

At this moment our API is open to the world, which is probably not the best as everyone will be able to Shorten URL's. You can check out [Set Up API Keys Using the API Gateway Console](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-setup-api-key-with-console.html) documentation on how to secure your application by utilizing a api key which can be included in your request headers when Shortening URLs.

For a bit of housekeeping, you can implement TTL on DynamoDB so that old items expire, which can help you to refrain your dynamodb table from growing into large amounts of storage, you can have a look at a post on [Delete Old Items with Amazons DynamoDB TTL Feature](https://blog.ruanbekker.com/blog/2017/11/22/delete-old-items-with-amazons-dynamodb-ttl-feature/) to implement that.


