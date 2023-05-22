---
layout: post
title: "How to Setup a Serverless URL Shortener with API Gateway Lambda and DynamoDB on AWS"
date: 2018-11-30 02:51:24 -0500
comments: true
categories: ["aws", "serverless", "api-gateway", "lambda", "dynamodb", "python"] 
---

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/5b850ec9-bee3-4623-a87a-2a174af5e664)

Today we will set a Serverless URL Shortener using API Gateway, Lambda with Python and DynamoDB.

## Overview 

The service that we will be creating, will shorten URLs via our API which will create an entry on DynamoDB. When a GET method is performed on the shortened URL, a GetItem is executed on DynamoDB to get the Long URL and a 301 Redirect is performed to redirect the client to intended destination URL.

Note, I am using a domain name which is quite long, but its only for demonstration, if you can get hold of any short domains like `t.co` etc, that will make your Shortened URLs really short in character count. 

Update: URL Shortener UI [available in this post](https://blog.ruanbekker.com/blog/2018/12/18/creating-a-ui-in-python-flask-and-bootstrap-for-our-serverless-url-shortener/)

## The Setup

Code has been published to my **[Github Repository](https://github.com/ruanbekker/aws-serverless-url-shortener)**

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

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/ec55e963-610a-4b3c-a4ea-064f53c08914)

## Lambda Functions

Once the table is created, head over to [Lambda](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/create?firstrun=true) and create a Lambda function, in my case using Python 3.6 and provide a name, where I used: `url-shortener-create` and select the IAM role from the previous role that we created, this function will be the lambda function that will create the shortened urls:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/d51782ed-15ef-4bea-b75c-130d7d152fac)

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

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/2a3bc1e2-4a0c-45d9-830a-3f3beabc2f80)

While you are on Lambda, create the function that will retrieve the long url, in my case `url-shortener-retrieve`:

```python
import os
import json
import boto3

ddb = boto3.resource('dynamodb', region_name = 'eu-west-1').Table('url-shortener-table')

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

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/a97ecae8-8cb4-4aff-90ee-a78900bb00fd)

Head over to Resources:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/187cb4ba-bec8-48d0-b0a0-624c280bb986)

and create a new resource called `/create`:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/9fa4e58f-f604-40fc-89cc-4996a9246330)

Once the resource is created, create a post method on the `create` resource and select Lambda as the integration type and lambda proxy integration as seen below:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/8943829f-6663-4355-a66a-415541dbc483)

Once you save it, it will ask to give api gateway permission to invoike your lambda function wich you can accept by hitting ok as below:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/428100ad-da67-40e3-8c9f-2adc8cb4ba09)

When you look at the POST method on your create resource, it should look like this:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/81edbccf-da59-4428-bcff-986e2c10c6d9)

Select the root resource `/` and from Actions create a new resource `/t`:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/30265753-f81b-464b-ba07-ec10983707c6)

Select the `/t` resource and create a new resource named `shortid` and provide `{shortid}` in the resource path as this will be the data that will be proxied through to our lambda function:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/4a21c6eb-bcca-4d01-b2f7-0eb84ceda7a0)

Create a GET method on the `/t/{shortid}` resource and select `url-shortener-retrieve` lambda function as the function from the lambda integration selection as seen below:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/4b54c050-99ac-4318-8a22-9a234cfbe316)

Again, grant api gateway permission to invoke your function:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/13621736-5f6e-407c-b612-4f6e935d396b)

When you select the GET method, it should look like this:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/425d6c33-46c8-4d32-ba6c-0ee3e113b5ee)

Select the Integration Request and head over to Mapping Templates:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/1cfcb0e0-a6e3-4b16-8677-5ce1f343619d)

from the Request body passtrhough, add a mapping template `application/json` and provide the following mapping template:


```json
{
    "short_id": "$input.params('shortid')"
}
```

On the Method Response:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/0635b7ba-3d13-4acd-9da6-2aaf86eab1c1)

Delete the 200 HTTP Status Response and create a new response by "Add Response", add `301` HTTP Status, add `Location` Header to the response.

Navigate to the Integration Response from the `/{shortid}` GET method:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/ac7caa14-1c46-4dc8-b702-8933ffb38ebb)

delete the 200 HTTP Response, add "integration response", set method response status to 301 and add header mapping for location to integration.response.body.location as below:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/8b598aab-aedb-4524-bade-2c86c51b71b5)

make sure to select the integration response to - so that the method response reflects to 301:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/495e2d00-22af-4184-8127-898b15a24ea0)

Navigate to Actions and select "Deploy API", select your stage, in my case `test` and deploy:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/c62ef0e0-aa2f-42f4-a197-0a795d44ac77)

Go to stages, select your stage, select the post request to reveal the API URL:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/57080a15-ceb1-4186-9338-63e1abd43066)

Time to test out the URL Shortener:

```bash
curl -XPOST -H "Content-Type: application/json" https://xxxxxx.execute-api.eu-west-1.amazonaws.com/test/create -d '{"long_url": "https://www.google.com/search?q=helloworld"}'
https://tiny.myserverlessapp.net/t/pcnWoCGCr2ad1x
```

## ACM Certificates

At this moment we dont have our domain connected with our API Gateway, and we would also want a certificate on our application, which we can use ACM to request a certificate that can be associated to our domain. So in order to do that, first request a certificate on [ACM](https://eu-west-1.console.aws.amazon.com/acm/home?region=eu-west-1#/privatewizard/). Select Request a certificate, create a wildcard entry: `*.yourdomain.com`, select DNS Validation (If you host with Route53, they allow you the option to create the record).

Head back to API Gateway to associate the Domain and ACM Certificate to our API:

From the "Custom Domain Names" section, create a custom domain name, once you selected regional, it will ask for the target domain name, which will be the resolved to your API Endpoint that was created, and from the "Base Path Mappings" section, select `/` as the path to your API stage, in my case `url-shortener-api:test`:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/86e569e2-321c-49f3-8b27-d87c7160378b)

## Route 53

Last part is to create a Route53 entry for tiny.yourdomain.com to resolve to the CNAME value of the target domain name that was provided in the custom domain names section:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/c25bba2d-7c76-44b1-a492-a66c81b29a0f)

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

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

