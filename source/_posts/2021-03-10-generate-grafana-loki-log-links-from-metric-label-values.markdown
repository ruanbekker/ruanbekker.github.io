---
layout: post
title: "Generate Grafana Loki Log Links from Metric Label Values"
date: 2021-03-10 00:34:04 -0500
comments: true
categories: ["grafana", "loki", "devops"]
---

In this tutorial we will generate Loki Log links from selected dropdown template variables in a Grafana Dashboard. 

## Context

To give more context, we have a Grafana Dashboard with all our services, and when you select that service you see all the metrics of that service, now if you want to see the logs of that service, the selected label values will be parsed to a log link which you can click and it will take you to the Loki Explorer and parse the label values to the log link, so your logql will already be generated for you.

In order to achieve this, our metrics and logs need to share the same labels and label values (environment, container_name) etc.

## Dashboard Variables

First we have our environment variable:

![image](https://user-images.githubusercontent.com/567298/109668240-a6862300-7b79-11eb-85ce-d381edfbe78e.png)

And here we have our service variable:

![image](https://user-images.githubusercontent.com/567298/109668438-dc2b0c00-7b79-11eb-9b17-629e9b1716a9.png)

Then for our container_name we have:

![image](https://user-images.githubusercontent.com/567298/109668632-05e43300-7b7a-11eb-97a0-8ff81f0c929c.png)

Notice the `/^(.*?)-[0-9]/` thats just to strip the end, if we remove it it will be:

![image](https://user-images.githubusercontent.com/567298/109668778-27451f00-7b7a-11eb-976f-a7d0b473cd1b.png)

## Grafana Dashboard

Now when we select the environment, service, we get presented with a Loki LogURL:

![image](https://user-images.githubusercontent.com/567298/109668970-552a6380-7b7a-11eb-8c72-b284cf0f5eec.png)

If we look at our dashboard links, under the dashboard settings:

![image](https://user-images.githubusercontent.com/567298/109669065-6b382400-7b7a-11eb-8a29-34b492fef327.png)

The Logs Uri is: 

```
https://grafana.mydomain.com/explore?orgId=1&left=%5B%22now-1h%22,%22now%22,%22Loki%22,%7B%22expr%22:%22%7Bcontainer_name%3D~%5C%22.*$container_name.*%5C%22%7D%22%7D,%7B%22mode%22:%22Logs%22%7D,%7B%22ui%22:%5Btrue,true,true,%22none%22%5D%7D%5D
```

Now when we select our label values from the dropdown for our service and we follow the link we will get:

![image](https://user-images.githubusercontent.com/567298/109669297-a33f6700-7b7a-11eb-8205-f021467af751.png)

