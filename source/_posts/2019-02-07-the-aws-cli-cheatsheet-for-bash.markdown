---
layout: post
title: "The AWS CLI Cheatsheet for Bash"
date: 2019-02-07 03:24:12 -0500
comments: true
categories: ["aws", "bash", "cli"] 
---

![](https://user-images.githubusercontent.com/30043398/52399083-cdb9b580-2ac3-11e9-8c8a-79fcb811de18.png)

This is a post for all the AWS CLI oneliners that I stumble upon. Note that they will be updated over time.

## SSM Parameter Store:

List all parameters by path:

```bash
$ aws --profile prod ssm get-parameters-by-path --path '/service-a/team-a/my-app-name/' | jq '.Parameters[]' | jq -r '.Name'
/service-a/team-a/my-app-name/db_hostname
/service-a/team-a/my-app-name/db_username
/service-a/team-a/my-app-name/db_password
```

Get a value from a parameter:

```bash
$ aws --profile prod ssm get-parameters --names '/service-a/team-a/my-app-name/db_username' --with-decryption | jq '.Parameters[]' | jq -r '.Value'
my_db_user
```
