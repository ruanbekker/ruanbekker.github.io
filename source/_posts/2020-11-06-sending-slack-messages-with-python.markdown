---
layout: post
title: "Sending Slack Messages with Python"
date: 2020-11-06 13:58:50 +0000
comments: true
categories: ["slack", "python"]
---

In this post I will demonstrate how to send messages to slack using python based on the status of an event. 

We will keep it basic, that when something is down or up, it should send a slack message with the status, message, color and embed your grafana dashboard links inside the alert (or any links that you would like).

## Create a Webhook

From a previous post on [how to use curl to send slack messages](https://blog.ruanbekker.com/blog/2019/04/18/setup-a-slack-webhook-for-sending-messages-from-applications/) I showed how to create your webhook, so you can just follow that post if you want to follow along.

Once you have a webhook, which will look like `https://hooks.slack.com/services/xx/yy/zz`, you are good to follow to the next step.

## Creating the Script

First we need requests:

```
$ pip install requests
```

Then we will create the `slack_notifier.py`, just ensure that you replace your slack webhook url and slack channel to yours:

```python
import requests
import sys
import os

SLACK_WEBHOOK_URL = 'https://hooks.slack.com/<your>/<slack>/<webhook>'
SLACK_CHANNEL = "#your-slack-channel"
ALERT_STATE = sys.argv[1]

alert_map = {
    "emoji": {
        "up": ":white_check_mark:",
        "down": ":fire:"
    },
    "text": {
        "up": "RESOLVED",
        "down": "FIRING"
    },
    "message": {
        "up": "Everything is good!",
        "down": "Stuff is burning!"
    },
    "color": {
        "up": "#32a852",
        "down": "#ad1721"
    }
}

def alert_to_slack(status, log_url, metric_url):
    data = {
        "text": "AlertManager",
        "username": "Notifications",
        "channel": SLACK_CHANNEL,
        "attachments": [
        {
            "text": "{emoji} [*{state}*] Status Checker\n {message}".format(
                emoji=alert_map["emoji"][status],
                state=alert_map["text"][status],
                message=alert_map["message"][status]
            ),
            "color": alert_map["color"][status],
            "attachment_type": "default",
            "actions": [
                {
                    "name": "Logs",
                    "text": "Logs",
                    "type": "button",
                    "style": "primary",
                    "url": log_url
                },
                {
                    "name": "Metrics",
                    "text": "Metrics",
                    "type": "button",
                    "style": "primary",
                    "url": metric_url
                }
            ]
        }]
    }
    r = requests.post(SLACK_WEBHOOK_URL, json=data)
    return r.status_code

alert_to_slack(ALERT_STATE, "https://grafana-logs.dashboard.local", "https://grafana-metrics.dashboard.local")
```

## Testing it out

Time to test it out, so let's assume something is down, then we can react on that event and action the following:

```
$ python slack_notifier.py down
```

Which will look like the following on slack:

![image](https://user-images.githubusercontent.com/567298/98374881-fdf00880-2049-11eb-9d7f-7599665871db.png)

And when recovery is in place, we can action the following:

```
$ python slack_notifier.py up
```

Which will look like this:

![image](https://user-images.githubusercontent.com/567298/98374958-1eb85e00-204a-11eb-8ab0-c6a8a0640752.png)

## Thanks

That was a basic example on how you can use python to send slack messages.
