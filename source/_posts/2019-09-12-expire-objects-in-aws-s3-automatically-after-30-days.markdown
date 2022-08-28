---
layout: post
title: "Expire Objects in AWS S3 Automatically after 30 Days"
date: 2019-09-12 22:37:11 +0200
comments: true
categories: ["aws", "s3", "storage"] 
---

![](https://objects.ruanbekker.com/assets/images/aws-logo.png)

In AWS S3 you can make use of lifecycle policies to manage the lifetime of your objects stored in S3.

In this tutorial, I will show you how to delete objects automatically from S3 after 30 days.

## Navigate to your Bucket

Head over to your AWS S3 bucket where you want to delete objects after they have been stored for 30 days:

<img width="1039" alt="0400F9CB-9223-4FDF-8FA5-D0BC1FA8EB71" src="https://user-images.githubusercontent.com/567298/64819546-c3f2b600-d5ae-11e9-93ba-13777e9b02b0.png">

## Lifecycle Policies

Select "Management" and click on "Add lifecycle rule":

<img width="701" alt="9BB26C7C-F251-45C4-AE44-A34459BD0F4B" src="https://user-images.githubusercontent.com/567298/64819628-f00e3700-d5ae-11e9-9740-8aa3608163a7.png">

Set a rule name of choice and you have the option to provide a prefix if you want to delete objects based on a specific prefix. I will leave this blank as I want to delete objects in the root level of the bucket. Head to next on the following section:

<img width="700" alt="AEF8B151-3FA8-454F-AC71-778A531BD1EE" src="https://user-images.githubusercontent.com/567298/64819785-58f5af00-d5af-11e9-8485-fb0dca3a02ac.png">

From the "Transitions" section, configure the transition section, by selecting to expire the current version of the object after 30 days:

<img width="701" alt="2B395671-A4C0-4E5A-82E7-00EE6579DB5A" src="https://user-images.githubusercontent.com/567298/64819851-7c205e80-d5af-11e9-98d7-7e1dd09bcfef.png">

Review the configuration:

<img width="705" alt="F7F8E800-62FF-4156-B506-5FB9BCC148E0" src="https://user-images.githubusercontent.com/567298/64819869-893d4d80-d5af-11e9-8034-8a2e3a8939f8.png">

When you select "Save", you should be returned to the following section:

<img width="1041" alt="8421EBCE-9503-4259-92AA-DB66C6F532AF" src="https://user-images.githubusercontent.com/567298/64819895-99edc380-d5af-11e9-84b4-7f4cc69cfd2e.png">

## Housecleaning on your S3 Bucket

Now 30 days after you created objects on AWS S3, they will be deleted.

