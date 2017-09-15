---
layout: post
title: "AWS: IAM S3 Policy for Cyberduck to Allow Listing Buckets and Access to One Bucket"
date: 2017-09-15 11:18:17 -0400
comments: true
categories: ["aws", "iam", "s3", "security", "cyberduck"] 
---

When using Cyberduck to access S3, and a account has restrictive policies, you may find error `Listing Directory: /` failed.

If you have restrictive IAM Policies in your account, this may be due to the fact that `S3:ListMyBuckets` is not allowed. 

In this post we want to allow a user to list all buckets, so that Cyberduck can do the initial list after configuration / launch, and we would like to give the user access to their designated bucket.

## Creating the IAM Policy:

We will create this IAM Policy and associate the policy to the user's account:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1480515305000",
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
        },
        {
            "Sid": "Stmt1480515305002",
            "Effect": "Allow",
            "Action": [
                "s3:List*",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::allowed-bucket",
                "arn:aws:s3:::allowed-bucket/*"
            ]
        }
    ]
}
```

So here we should be able to list the buckets:

```bash
$ aws --profile cyberduck s3 ls /
2017-06-08 08:27:01 allowed-bucket
2017-05-21 13:39:21 private-bucket
2016-12-21 08:23:45 confidential-bucket
2017-08-10 14:18:19 test-bucket
2016-08-03 12:38:29 datalake-bucket
```

Able to list inside the bucket, as well as Get, Put etc.

```bash
$ aws --profile cyberduck s3 ls allowed-bucket/
                           PRE data/
```

Unable to list the buckets content which is expected, as we did not mention in the policy:

```bash
$ aws --profile cyberduck s3 ls confidential-bucket/

An error occurred (AccessDenied) when calling the ListObjects operation: Access Denied
```

## Resources:

- https://aws.amazon.com/blogs/security/writing-iam-policies-how-to-grant-access-to-an-amazon-s3-bucket/
