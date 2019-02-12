---
layout: post
title: "The AWS CLI Cheatsheet for Bash"
date: 2019-02-07 03:24:12 -0500
comments: true
categories: ["aws", "bash", "cli"] 
---

![](https://user-images.githubusercontent.com/30043398/52399083-cdb9b580-2ac3-11e9-8c8a-79fcb811de18.png)

This is a post for all the AWS CLI oneliners that I stumble upon. Note that they will be updated over time.

## RDS

Describe All RDS DB Instances:

```bash
$ aws --profile prod rds describe-db-instances --query 'DBInstances[*].[DBInstanceArn,DBInstanceIdentifier,DBInstanceClass,Endpoint]'
```

Describe a RDS DB Instance with a dbname:

```bash
$ aws --profile prod rds describe-db-instances --query 'DBInstances[?DBInstanceIdentifier==`db-staging`].[DBInstanceArn,DBInstanceIdentifier,DBInstanceClass,Endpoint]'
[
    [
        "arn:aws:rds:eu-west-1:<customer_id>:db:db-staging",
        "db-staging",
        "db.t2.micro",
        {
            "HostedZoneId": "ASKDJSAKDJBA",
            "Port": 5432,
            "Address": "db-staging.asdkjahsd.eu-west-1.rds.amazonaws.com"
        }
    ]
]
```

List all RDS DB Instances and limit output:

```bash
$ aws --profile prod rds describe-db-instances --query 'DBInstances[*].[DBInstanceArn,DBInstanceIdentifier,DBInstanceClass,Endpoint]'
[
    [
        "arn:aws:rds:eu-west-1:<customer_id>:db:db-name",
        "db-name",
        "db.t2.micro",
        {
            "HostedZoneId": "ABCDEFGHILKL",
            "Port": 5432,
            "Address": "db-name.abcdefg.eu-west-1.rds.amazonaws.com"
        }
    ],
```

List all RDS DB Instances that has backups enabled, and limit output:

```bash
$ aws --profile prod rds describe-db-instances --query 'DBInstances[?BackupRetentionPeriod>`0`].[DBInstanceArn,DBInstanceIdentifier,DBInstanceClass,Endpoint]'
[
    [
        "arn:aws:rds:eu-west-1:<customer_id>:db:db-name",
        "db-name",
        "db.t2.micro",
        {
            "HostedZoneId": "ABCDEFGHILKL",
            "Port": 5432,
            "Address": "db-name.abcdefg.eu-west-1.rds.amazonaws.com"
        }
    ],
```

Describe DB Snapshots for DB Instance Name:

```bash
$ aws --profile prod rds describe-db-snapshots --db-instance-identifier db --query 'DBSnapshots[?DBInstanceIdentifier==`db`].[DBInstanceIdentifier,DBSnapshotIdentifier,SnapshotCreateTime,Status]'
[
    [
        "db",
        "rds:db-2018-05-16-04-08",
        "2018-05-16T04:08:53.696Z",
        "available"
    ],
```

Events for the last 24 Hours:

```bash
$ aws --profile prod rds describe-events --source-identifier "rds:db-2018-05-16-04-08" --source-type db-snapshot --duration 1440 --query 'Events[*]'
[
    {
        "EventCategories": [
            "creation"
        ],
        "SourceType": "db-snapshot",
        "SourceArn": "arn:aws:rds:eu-west-1:<customer_id>:snapshot:rds:db-2018-05-16-04-08",
        "Date": "2018-05-16T04:08:40.264Z",
        "Message": "Creating automated snapshot",
        "SourceIdentifier": "rds:db-2018-05-16-04-08"
    },
    {
        "EventCategories": [
            "creation"
        ],
        "SourceType": "db-snapshot",
        "SourceArn": "arn:aws:rds:eu-west-1:<customer_id>:snapshot:rds:db-2018-05-16-04-08",
        "Date": "2018-05-16T04:32:04.047Z",
        "Message": "Automated snapshot created",
        "SourceIdentifier": "rds:db-2018-05-16-04-08"
    }
]
```

List Public RDS Instances:

```bash
$ aws --profile prod rds describe-db-instances --query 'DBInstances[?PubliclyAccessible==`true`].[DBInstanceIdentifier,Endpoint.Address]'

[
  [
    "name",
    "name.abcdef.eu-west-1.rds.amazonaws.com"
  ]
]
```

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
