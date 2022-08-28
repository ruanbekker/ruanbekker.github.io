---
layout: post
title: "Change IAM Username with AWS CLI"
date: 2017-08-28 18:27:21 -0400
comments: true
categories: ["aws", "iam", "awscli"] 
---

You may find yourself in a position where you need to rename more than one IAM Username, and one way of doing this is using the AWS CLI tools to rename the username.

The benefit of this is that the user's access keys remains the same, any policies associated to the user, will stay on the user after the username gets renamed.

The only thing that changes, is ofcourse the username that the user will use when logging onto the AWS Management Console:


## Details of our User:

We will change the IAM User `peter` to `peter.franklin`. Currently Peter's ACCESS_KEY will be `AKIA123456ABCDEF1234` which is configured with the profile name `peter`.

Lets first get details of our user before changing it:

```bash 
$ aws --profile admin iam get-user --user-name peter
{
    "User": {
        "UserName": "peter",
        "PasswordLastUsed": "2017-08-28T13:17:22Z",
        "CreateDate": "2017-08-28T13:11:25Z",
        "UserId": "ABCDEFGHIJKLMNOPQRST",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:user/peter"
    }
}
```

## Rename the IAM User

Update user peter to peter.franklin:

```bash Rename the IAM User
$ aws --profile aws iam update-user --user-name peter --new-user-name peter.franklin
```

Describe peter's new username:

```bash
$ aws --profile aws iam get-user --user-name peter.franklin
{
    "User": {
        "UserName": "peter.franklin",
        "PasswordLastUsed": "2017-08-28T13:23:18Z",
        "CreateDate": "2017-08-28T13:11:25Z",
        "UserId": "ABCDEFGHIJKLNMOPQRST",
        "Path": "/",
        "Arn": "arn:aws:iam::123456789012:user/peter.franklin"
    }
}
```

Verify that access keys are the same:

```bash
$ aws --profile aws iam list-access-keys --user-name peter.franklin
{
    "AccessKeyMetadata": [
        {
            "UserName": "peter.franklin",
            "Status": "Active",
            "CreateDate": "2017-08-28T13:11:27Z",
            "AccessKeyId": "AKIA123456ABCDEF1234"
        }
    ]
}
```

At this momemnt we can see that Peter's AccessKeyId is still the same, which means he does not have to update his credentials on his end.

## Some Useful CLI Commands:

Get only the Access Key for a User:

```bash
$ aws --profile admin iam list-access-keys --user-name peter.franklin | jq -r '.[][].AccessKeyId'
AKIA123456ABCDEF1234
```

## Determine when the AccessKey was last used, and for which Service:

For auditing, or verifying if a AccessKeyId is being used, we can call the `get-access-key-last-used`, which will give us the last time the key was used, and also see for which service in question.

Let Peter create a DynamoDB Table:

```bash
$ aws --profile peter dynamodb \
create-table --table-name test01 \
--attribute-definitions "AttributeName=username,AttributeType=S" \
--key-schema "AttributeName=username,KeyType=HASH" \
--provisioned-throughput "ReadCapacityUnits=1,WriteCapacityUnits=1"
```
```json
{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:eu-west-1:123456789012:table/test01",
        "AttributeDefinitions": [
            {
                "AttributeName": "username",
                "AttributeType": "S"
            }
        ],
        "ProvisionedThroughput": {
            "NumberOfDecreasesToday": 0,
            "WriteCapacityUnits": 1,
            "ReadCapacityUnits": 1
        },
        "TableSizeBytes": 0,
        "TableName": "test01",
        "TableStatus": "CREATING",
        "KeySchema": [
            {
                "KeyType": "HASH",
                "AttributeName": "username"
            }
        ],
        "ItemCount": 0,
        "CreationDateTime": 1503928537.671
    }
}
```

Get Detail on LastUsedDate:

```bash
$ aws --profile admin iam get-access-key-last-used  --access-key $(aws --profile aws iam list-access-keys --user-name peter.franklin | jq -r '.[][].AccessKeyId') | jq -r '.[]'
peter.franklin
{
  "Region": "eu-west-1",
  "ServiceName": "dynamodb",
  "LastUsedDate": "2017-08-28T13:55:00Z"
}
```

Only getting the LastUsedDate of the AccessKeyId:

```bash
$ aws --profile admin iam get-access-key-last-used  --access-key $(aws --profile aws iam list-access-keys --user-name peter.franklin | jq -r '.[][].AccessKeyId') | jq '.AccessKeyLastUsed.LastUsedDate'
"2017-08-28T13:55:00Z"
```

## Resources:

- - http://docs.aws.amazon.com/cli/latest/reference/iam/update-user.html?shortFooter=true
