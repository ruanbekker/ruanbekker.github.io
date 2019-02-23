---
layout: post
title: "Building Python Serverless Slack Apps on OpenFaas"
date: 2019-02-21 16:29:15 -0500
comments: true
categories: ["openfaas", "serverless", "slack", "python"]
---

![](https://camo.githubusercontent.com/cf01eefb5b6905f3774376d6d1ed55b8f052d211/68747470733a2f2f626c6f672e616c6578656c6c69732e696f2f636f6e74656e742f696d616765732f323031372f30382f666161735f736964652e706e67)

If you are not familliar with OpenFaas, it's definitely time that you should have a look at it, plus, they are doing some pretty awesome work! 

<script src="//ap.lijit.com/www/delivery/fpi.js?z=601357&width=160&height=600"></script> 

From their documentation: "OpenFaaS (Functions as a Service) is a framework for building serverless functions with Docker and Kubernetes which has first class support for metrics. Any process can be packaged as a function enabling you to consume a range of web events without repetitive boiler-plate coding."

Make sure to give them a visit at [openfaas.com](https://docs.openfaas.com) and while you are there, in the world of serverless, have a look at how Alex outlines architecture and patterns he applies in a real-world example, [absolutely great read!](https://www.openfaas.com/blog/serverless-single-page-app/)

## What are we doing today?

Today we will build a slack app using python which we will deploy as a function on OpenFaas!

Our slash command will make a request to our `slack-request` function, which will respond with a json string, which will then be parsed in a slack attachment message, then based on your button decision, it will then invoke our `slack-interaction` function, which will then respond with another message that will allow you to follow the embedded link.

The slack messages are really basic, but you can create a awesome workflow using slack apps. And the best of all, its running on OpenFaas!

## Deploying OpenFaas

Docker Swarm and Kubernetes are supported, but since I am using Docker Swarm at the moment of writing, this tutorial will show how to deploy OpenFaas to your cluster. Have a look at [OpenFaas Documentation](https://docs.openfaas.com/deployment/docker-swarm/) for more detailed information.

Installing OpenFaas CLI for Mac:

```bash
$ brew install faas-cli
```

Deploy the OpenFaas Stack:

```bash
$ git clone https://github.com/openfaas/faas
$ cd faas 
$ ./deploy_stack.sh
```

Credentials: The default configuration will create credentials for you and returns instructions on how to authorize faas-cli, for demonstration it will look more or less like the following:

```bash
$ echo -n <some_hash_secret> | faas-cli login --username=admin --password-stdin
```

The UI will be available at: http://127.0.0.1:8080. For this demonstration we will only use the cli.

## Create the Functions

I will create 2 python functions:

* The `slack-request` function, which will be associated to the slash command
* The `slack-interactive` function, which will be used for interactivity

Create a home directory for your functions and create 2 functions:

```bash
$ mkdir -p ~/functions && cd ~/functions
$ faas-cli new --lang python slack-request
$ faas-cli new --lang python slack-interactive
```

Read the [documentation](https://docs.openfaas.com/tutorials/first-python-function/) if you'd like to learn more. 

Configure the first function:

```bash
$ vim slack-request/handler.py
```

And our function code:

```python
import json

def handle(req):
    data = {
        "text": "Serverless Message",
        "attachments": [{
            "title": "The Awesome world of Serverless introduces: OpenFaas!",
            "fields": [{
                "title": "Amazing Level",
                "value": "10",
                "short": True
            },
	    {
                "title": "Github Stars",
                "value": "15k +",
                "short": True
            }],
            "author_name": "OpenFaas",
            "author_icon": "",
            "image_url": "https://blog.alexellis.io/content/images/2017/08/small.png"
        },
        {
            "title": "About OpenFaas",
            "text": "OpenFaaS is a framework for packaging code, binaries or containers as Serverless functions on any platform."
        },
        {
            "fallback": "Would you recommend OpenFaas to your friends?",
            "title": "Would you recommend OpenFaas to your friends?",
            "callback_id": "response123",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": [
                {
                    "name": "recommend",
                    "text": "Ofcourse!",
                    "type": "button",
                    "value": "recommend"
                },
                {
                    "name": "definitely",
                    "text": "Most Definitely!",
                    "type": "button",
                    "value": "definitely"
                }
            ]
        }]
    }
    return json.dumps(data)
```

Since our response needs to be parsed as json, we need to set the content type for our environment in our yaml configuration. Read more on it [here](https://docs.openfaas.com/reference/yaml/). Edit the `slack-request.yml` :

```yaml
provider:
  name: faas
  gateway: http://<your.gw.address>:8080
functions:
  slack-request:
    lang: python
    handler: ./slack-request
    image: <your-repo>/slack-request:latest
    environment:
      content_type: application/json
```

Now we need to build our image, push it to our repository like dockerhub, then deploy to openfaas:

```bash
$ faas-cli build -f ./slack-request.yml 
$ faas-cli push -f ./slack-request.yml 
$ faas-cli deploy -f ./slack-request.yml
Deploying: slack-request.

Deployed. 202 Accepted.
URL: http://your.gw.address:8080/function/slack-interactive
```

Configure the `slack-interactive` function:

```bash
$ vim slack-interactive/handler.py
```

Note that whenever your interact with the first message, a post request will be made against the interactivity request url, you will notice that I decoded the payload (but not doing anything with it), where you will find the callback_id, request_url etc. But for simplicity, I am just using a static json message to respond. Our function code:

```python
import json
import urllib

def handle(req):
    urlstring = urllib.unquote(req).decode('utf8').strip('payload=')
    response = json.loads(urlstring)
    data = {
        "attachments": [
            {
                "replace_original": True,
                "response_type": "ephemeral",
                "fallback": "Required plain-text summary of the attachment.",
                "color": "#36a64f",
                "pretext": "Ahh yeah! Great choice, OpenFaas is absolutely brilliant!",
                "author_name": "",
                "author_link": "https://github.com/openfaas/faas",
                "author_icon": "http://flickr.com/icons/bobby.jpg",
                "title": "OpenFaas",
                "title_link": "https://github.com/openfaas/faas",
                "text": "Head over to OpenFaas",
                "image_url": "https://avatars2.githubusercontent.com/u/27013154?s=400&v=4",
                "thumb_url": "https://github.com/openfaas/faas",
                "footer": "Slack Apps built on OpenFaas",
                "footer_icon": "https://a.slack-edge.com/45901/marketing/img/_rebrand/meta/slack_hash_256.png",
                "ts": 123456789
            }
        ]
    }
    return json.dumps(data)
```

We also need to set the content type to json:

```bash
provider:
  name: faas
  gateway: http://<your.gw.address>:8080
functions:
  slack-interactive:
    lang: python
    handler: ./slack-interactive
    image: <repo>/slack-interactive:latest
    environment:
      content_type: application/json
```

Build, deploy and ship:

```bash
$ faas-cli build -f ./slack-interactive.yml 
$ faas-cli push -f ./slack-interactive.yml
$ faas-cli deploy -f ./slack-interactive.yml

Deploying: slack-interactive.

Deployed. 202 Accepted.
URL: http://<your.gw.address>:8080/function/slack-interactive
```

When your functions are deployed, go ahead and create the slack app.

## Create the Slack App

* Head over to https://api.slack.com/apps and create a new app
* Create a incoming webhook
* Head over to slash commands and create a new command, in my case it was `/supersam`, set the request url to the public endpoint of your function: `http://pub-ip:8080/function/slack-request`
* Head over to interactive components, set the request url for the interactivity: `http://pub-ip:8080/function/slack-interactive`
* If you dont have a public routable address, have a look at [ngrok](https://ngrok.com)

Once you are set, you should be able to see the slash command integration in your slack workspace, head over to slacks [documentation](https://api.slack.com/docs) if you run into any trouble.

## Test your Slack App

Now that everything is good to go, its time to test your slack app running on OpenFaas!

Head over to slack and run your command `/<your-slack-slash-command>`. You should see this output:

![](https://user-images.githubusercontent.com/567298/53206700-56932e00-363a-11e9-8d44-dfd27f005ab0.png)

When you select one of the buttons, you will get a new message:

![](https://user-images.githubusercontent.com/567298/53206764-74f92980-363a-11e9-91cb-6cfc30c74457.png)

This is a real basic example of slack apps, but slack apps are really powerful. You can for example create a slack app that deploys ephemeral environments on swarm, or create change management approval workflows etc.

I hope this was informative, I am really enjoying OpenFaas at the moment and if your have not tested it, I encourage you to try it out, its really, really amazing!
