---
layout: post
title: "Send SMS Messages with Python and Twilio via their API"
date: 2018-03-02 17:09:56 -0500
comments: true
categories: ["python", "api", "twilio", "sms"] 
---

This post will guide you through the steps on how to send SMS messages with Python and Twilio. We will use `talaikis.com` API to get a random quote that we will include in the body of the sms.

## Signup for a Trail Account:

Sign up for a trail account at [Twilio](https://www.twilio.com) then create a number, which I will refer to as the `sender number`, take note of your accountid and token.

## Create the Config:

Create the config, that will keep the accountid, token, sender number and recipient number:

```python config.py
secrets = {
    'account': 'xxxxxxxx',
    'token': 'xxxxxxx',
    'sender': '+1234567890',
    'receiver': '+0987654321'
}
```

## Create the Client:

We will get a random quote via talaikis.com's API which we will be using for the body of our text message, and then use twilio's API to send the text message:

```python sms_client.py
from config import secrets
from twilio.rest import Client
import requests

twilio_acountid = secrets['account']
twilio_token = secrets['token']
twilio_receiver = secrets['receiver']
twilio_sender = secrets['sender']

quote_response = requests.get('https://talaikis.com/api/quotes/random').json()

client = Client(
    twilio_acountid, 
    twilio_token
)

message = client.messages.create(
    to=twilio_receiver, 
    from_=twilio_sender, 
    body=quote_response['quote']
)
```

## Message Preview:

Then within a couple of seconds your message should look something more or less like this:

![](https://i.snag.gy/Oqj2cP.jpg)

For more info, have a look at their docs:
- https://www.twilio.com/docs/
