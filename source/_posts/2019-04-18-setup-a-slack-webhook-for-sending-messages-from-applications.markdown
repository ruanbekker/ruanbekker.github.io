---
layout: post
title: "Setup a Slack Webhook for Sending Messages from Applications"
description: "setup a slack webhook to notify you in response of events"
date: 2019-04-18 06:07:42 -0400
comments: true
categories: ["slack", "curl", "notifications", "messages"] 
---

![slack](https://user-images.githubusercontent.com/567298/56354543-55165a00-61d4-11e9-9101-f979dcb4cdb3.png)


Slack is amazing and I cant live without it. 

We can also use custom webhook integrations to allow applications to notify us via slack in response of events.

## What we will be doing

We will be configuring a custom slack webhook integration and test out the api to show you how easy it is to use it to inform us via slack, whenever something is happening. 

## Configuration

Head over to:
- https://{your-team}.slack.com/apps/manage/custom-integrations

Select Incoming Webhooks:

![](https://user-images.githubusercontent.com/567298/56352324-49746480-61cf-11e9-8dd2-e4482fc16f9e.png)

Select Add Configuration:

![](https://user-images.githubusercontent.com/567298/56352369-6ad55080-61cf-11e9-9d98-4193a7aeb321.png)

Select the channel it should post to:

![](https://user-images.githubusercontent.com/567298/56352447-90625a00-61cf-11e9-8f94-098b2c088159.png)

Select Add Incoming Webhook Integration.

Save the webhook url that will look like this:

```
https://hooks.slack.com/services/ABCDEFGHI/ZXCVBNMAS/AbCdEfGhJiKlOpRQwErTyUiO
```

You can then further configure the integration.

## Sending Messages

```
curl -XPOST -d 'payload={"channel": "#system_events", "username": "My-WebhookBot", "text": "This is posted to #general and comes from a bot named <https://alert-system.com/alerts/1234|webhookbot> for details!", "icon_emoji": ":borat:"}' https://hooks.slack.com/services/xx/xx/xx
```

Will result in:

![image](https://user-images.githubusercontent.com/567298/56353019-be946980-61d0-11e9-874c-56074b8d2da7.png)

Message Attachment, Error:

```
curl -XPOST -d 'payload={"channel": "#system_events", "username": "My-WebhookBot", "text": "*Incoming Alert!*", "icon_emoji": ":borat:", "attachments":[{"fallback":"New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>","pretext":"New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>","color":"#D00000","fields":[{"title":"Notes","value":"This is much easier than I thought it would be.","short":false}]}]}}' https://hooks.slack.com/services/xx/xx/xx
```

Results in:

![image](https://user-images.githubusercontent.com/567298/56353534-df10f380-61d1-11e9-92f5-f14a75c19049.png)

Message Attachment, OK:

```
curl -XPOST -d 'payload={"channel": "#system_events", "username": "My-WebhookBot", "text": "*Status Update:*", "icon_emoji": ":borat:", "attachments":[{"fallback":"New open task has been closed [OK]: <http://url_to_task|Test out Slack message attachments>","pretext":"Task has been closed [OK]: <http://url_to_task|Test out Slack message attachments>","color":"#28B463","fields":[{"title":"Notes","value":"The error has been resolved and the status is OK","short":false}]}]}}' https://hooks.slack.com/services/xx/xx/xx
```

Results in:

![image](https://user-images.githubusercontent.com/567298/56353591-f819a480-61d1-11e9-8810-3586f56dd0f3.png)

## Join my Slack

If you want to join my slack workspace, use [this invite link](https://join.slack.com/t/linux-hackers/shared_invite/enQtNjE0NDMzODI1OTI2LTFhYTRkNTQxYzAyMjQwNTNhMmE5ZmZkYjU2MDg2NGFlOTYyNmM2MjdkMzg1NTMwOTM0MGY1MjVmMTdhYjkxZTk)

## Resources:
- https://htmlcolorcodes.com/
- https://api.slack.com/docs/message-attachments

