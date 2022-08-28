---
layout: post
title: "Setting the Correct Service Name in Datadog Logging for Docker Swarm"
date: 2019-12-11 23:35:53 +0200
comments: true
categories: ["datadog", "docker", "swarm", "logging"] 
---

For some reason, when logging to datadog from your applications running on docker swarm, the service names in datadog appears to have the names on the docker image. The application talks to the datadog agent which runs in global mode on swarm.

Setting `DATADOG_SERVICE_NAME` or `DD_SERVICE_NAME` as environment variables on the swarm service has zero affect, as they keep showing the service name as the docker image name, as example:

<img width="1268" alt="08496333-01C4-4492-807E-FAC40826AFDE" src="https://user-images.githubusercontent.com/567298/70661591-49007080-1c6d-11ea-8230-0dbe086bd168.png">

If we inspect the tags, we can see that the docker image shows as the source and maps through as the docker service name. As you can see the swarm service name is what we want to be the service name (not alpine):

<img width="1269" alt="783C6D52-62B2-4F2B-A6D4-28150CC58005" src="https://user-images.githubusercontent.com/567298/70661651-65041200-1c6d-11ea-858b-90034099c319.png">

One way how to fix this is to setup a pipeline processor, head over to Logs -> Configuration:

<img width="267" alt="93CEE277-55A6-4DE1-8AE6-A02C64B0ACAD" src="https://user-images.githubusercontent.com/567298/70661767-adbbcb00-1c6d-11ea-8274-ad5da6ddfdd7.png">

Select "Pipelines" and add a new pipeline, select the filter `source:alpine` to limit down the results to the alpine image, and name your processor:

<img width="763" alt="0BF3D6A6-9646-442D-A494-8DF489C5217F" src="https://user-images.githubusercontent.com/567298/70661837-cdeb8a00-1c6d-11ea-8fb4-2c272fda596f.png">

Next add a new processor and set the type to remapper, select the tag group as "swarm_service" and set the attribute to service and name the processor:

<img width="762" alt="C02092F4-0EEC-4AF9-9E2A-F7A126560CD8" src="https://user-images.githubusercontent.com/567298/70662081-3a668900-1c6e-11ea-9ea9-9f80dfc669f3.png">

Add a new processor:

<img width="1151" alt="5C2F7FB9-8948-4588-A283-86E94BC07513" src="https://user-images.githubusercontent.com/567298/70661901-e6f43b00-1c6d-11ea-9dbc-8c4c3a24b51b.png">

Select a service remapper, set the attribute to service and name the processor:

<img width="761" alt="852904AE-9395-4B4B-B1F4-54427D88C970" src="https://user-images.githubusercontent.com/567298/70661986-0ab78100-1c6e-11ea-9edc-5fd748d73d0c.png">

Now when you go back to logs, you will find that the service name is being set to the correct service name in datadog:

<img width="1159" alt="0F11DDC4-E99C-4A2F-B6AB-7409B4E7546C" src="https://user-images.githubusercontent.com/567298/70662290-95987b80-1c6e-11ea-8d8c-bec4d44cde60.png">

When you inspect one of the logs, you will see that the attribute is being set to the log:

<img width="633" alt="4B098970-6345-40B9-9F90-411D8FE6A9E6" src="https://user-images.githubusercontent.com/567298/70662330-a9dc7880-1c6e-11ea-8b48-51900161cf01.png">

