---
layout: post
title: "Testing AWS Lambda Functions Locally on Docker with LambCi"
date: 2019-11-14 23:57:10 +0200
comments: true
categories: ["docker", "aws", "lambda"]
---

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I discovered a Docker image called **LambCi** that allows you to test lambda functions locally on docker and wanted to share with you how it works.

## Python Lambda Function

We will create a basic lambda function to demonstrate how it works.

```
$ mkdir task

cat > task/lambda_function.py << EOF
import json

def lambda_handler(event, context):
    if event:

        try:
            event['name']
            name = event['name']
            output_string = 'My name is {}'.format(name.capitalize())

        except KeyError:
            output_string = 'A name was not defined in the event payload'

    return output_string
EOF
```

Now that we've created the function, run the docker container with the parameters of the functions handler method and the event parameters:

```
$ docker run --rm -v "$PWD/task":/var/task lambci/lambda:python3.7 lambda_function.lambda_handler '{"name": "ruan"}'
START RequestId: 70025895-1233-1362-8006-c2784b5d80b6 Version: $LATEST
END RequestId: 70025895-1233-1362-8006-c2784b5d80b6
REPORT RequestId: 70025895-1233-1362-8006-c2784b5d80b6	Duration: 7.51 ms	Billed Duration: 100 ms	Memory Size: 1536 MB	Max Memory Used: 23 MB
"My name is Ruan"
```

And another call:

```
$ docker run --rm -v "$PWD/task":/var/task lambci/lambda:python3.7 lambda_function.lambda_handler '{"nam": "ruan"}'
START RequestId: f7ab2e97-05db-1184-a009-11b92638534f Version: $LATEST
END RequestId: f7ab2e97-05db-1184-a009-11b92638534f
REPORT RequestId: f7ab2e97-05db-1184-a009-11b92638534f	Duration: 5.32 ms	Billed Duration: 100 ms	Memory Size: 1536 MB	Max Memory Used: 23 MB
"A name was not defined in the event payload"
```

Checkout the dockerhub page for more info:
- https://hub.docker.com/r/lambci/lambda/

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>
