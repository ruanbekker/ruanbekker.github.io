---
layout: post
title: "Difference with ECS Task and Execution IAM Roles on AWS"
date: 2021-07-31 03:37:34 -0400
comments: true
categories: ["aws", "ecs", "iam", "security"]
---

![](https://blog.ruanbekker.com/images/ruanbekker-header-photo.png)

In this post we will look at what the difference is between the [AWS ECS Task Execution IAM Role](https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-iam-roles.html) and the [IAM Role for Tasks](https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-iam-roles.html) and give a example policy to demonstrate.

## ECS Task Execution Role

The ECS Execution Role is used by the ecs-agent which runs on ECS and is responsible for:
- Pulling down docker images from ECR
- Fetching the SSM Parameters from SSM for your Task (Secrets and LogConfigurations)
- Writing Logs to CloudWatch

The IAM Role has been configured that the Trusted Identity is ecs so only ECS is allowed to assume credentials from the IAM Policy that is associated to the Role.

The trusted identity in the IAM Role to be ecs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

and the policy will look like this more or less for a example service, I am demonstrating my-dev-service:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        },
        {
            "Sid": "SSMGetParameters",
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter"
            ],
            "Resource": "arn:aws:ssm:eu-west-1:*:parameter/my-service/dev/*"
        },
        {
            "Sid": "KMSDecryptParametersWithKey",
            "Effect": "Allow",
            "Action": [
                "kms:GetPublicKey",
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        }
    ]
}
```

In the ECS Task Definition the role arn is specified as `"executionRoleArn"` in:

```json
{
  "family": "my-dev-service",
  "executionRoleArn":"arn:aws:iam::000000000000:role/ecs-exec-role",
  "taskRoleArn":"arn:aws:iam::000000000000:role/ecs-task-role",
  "containerDefinitions": []
}
```

## ECS Task Role

The ECS Task Role is used by the service that is deployed to ECS, so this will be your application requiring access to SQS as an example

Same as before, we set the trusted identity in the IAM Role to be ecs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

So only the ECS tasks using the role is allowed to assume credentials from the IAM Role, and the policy associated to the role, can look something like this:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowDevSQS",
            "Effect": "Allow",
            "Action": [
                "sqs:GetQueueUrl",
                "sqs:ReceiveMessage",
                "sqs:SendMessage",
                "sqs:ChangeMessageVisibility"
            ],
            "Resource": [
                "arn:aws:sqs:eu-west-1:000000000000:dev-pending-queue",
                "arn:aws:sqs:eu-west-1:000000000000:dev-confirmed-queue"
            ]
        }
    ]
}
```

The role arn will be specified in `"taskRoleArn"` from the following in the ECS Task Definition:

```json
{
  "family": "my-dev-service",
  "executionRoleArn":"arn:aws:iam::000000000000:role/ecs-exec-role",
  "taskRoleArn":"arn:aws:iam::000000000000:role/ecs-task-role",
  "containerDefinitions": []
}
```


## Application Code

In your application you don’t need to reference any aws access keys as the role will assume credentials for you by the SDK, with python a short example will be:

```python
import boto3
sqs = boto3.Session(region_name='eu-west-1').client('sqs')
```

## Thanks

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
