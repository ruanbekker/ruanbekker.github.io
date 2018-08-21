---
layout: post
title: "Send Emails using Python and Sendgrid using SMTPlib"
date: 2018-08-21 11:30:08 -0400
comments: true
categories: ["email", "python", "smtp", "smtplib", "sendgrid"]
---

![](https://objects.ruanbekker.com/assets/images/sendgrid-logo.png)

Quick tutorial on how to send emails using Python and smtplib.

## Sendgrid

Sendgrid offers 100 free outbound emails per day, sign up with them via [sendgrid.com/free](https://sendgrid.com/free/), create a API Key and save your credentials in a safe place.

You first need to verify your account by sending a mail using their API, but it's step by step so won't take more than 2 minutes to complete.

## Python Code

Once the verification is completed, our Python Code:

```python
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

mail_from = 'Ruan Bekker <ruan@ruanbekker.com>'
mail_to = 'Ruan Bekker <xxxx@gmail.com>'

msg = MIMEMultipart()
msg['From'] = mail_from
msg['To'] = mail_to
msg['Subject'] = 'Sending mails with Python'
mail_body = """
Hey,

This is a test.

Regards,\nRuan

"""
msg.attach(MIMEText(mail_body))

try:
    server = smtplib.SMTP_SSL('smtp.sendgrid.net', 465)
    server.ehlo()
    server.login('apikey', 'your-api-key')
    server.sendmail(mail_from, mail_to, msg.as_string())
    server.close()
    print("mail sent")
except:
    print("issue")
```

When I ran the code, I received the mail, and when you inspect the headers you can see that the mail came via sendgrid:

```
Received: from xx.xx.s2shared.sendgrid.net (xx.xx.s2shared.sendgrid.net. [xx.xx.xx.xx])
``` 

Enjoy :D 
