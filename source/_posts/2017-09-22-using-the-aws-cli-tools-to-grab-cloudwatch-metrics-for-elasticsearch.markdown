---
layout: post
title: "Using the AWS CLI tools to grab CloudWatch Metrics for Elasticsearch"
date: 2017-09-22 18:06:23 -0400
comments: true
categories: ["aws", "cli", "linux", "monitoring", "cloudwatch", "elasticsearch"] 
---

Using the AWS CLI Tools to get CloudWatch Metrics for Elasticsearch.

## Elasticsearch:

List the JVM Memory Pressure Metric:

```bash
$ aws cloudwatch list-metrics --namespace AWS/ES --metric-name JVMMemoryPressure
{
    "Metrics": [
        {
            "Namespace": "AWS/ES",
            "Dimensions": [
                {
                    "Name": "DomainName",
                    "Value": "elasticsearch-cluster"
                },
                {
                    "Name": "ClientId",
                    "Value": "123456789012"
                }
            ],
            "MetricName": "JVMMemoryPressure"
        }
    ]
}
```

## Metric: JVMMemoryPressure

Getting Metrics for JVMMemoryPressure, every 10 Minutes for Max Statistic:

```bash
$ aws cloudwatch get-metric-statistics --namespace AWS/ES --dimensions Name=DomainName,Value=elasticsearch-cluster Name=ClientId,Value=123456789012 --metric-name JVMMemoryPressure --start-time 2017-09-08T04:00:00 --end-time 2017-09-08T05:00:00 --period 600 --statistics Maximum
{
    "Datapoints": [
        {
            "Timestamp": "2017-09-08T04:40:00Z",
            "Maximum": 58.7,
            "Unit": "Percent"
        },
        {
            "Timestamp": "2017-09-08T04:00:00Z",
            "Maximum": 58.5,
            "Unit": "Percent"
        },
        {
            "Timestamp": "2017-09-08T04:30:00Z",
            "Maximum": 58.7,
            "Unit": "Percent"
        },
        {
            "Timestamp": "2017-09-08T04:20:00Z",
            "Maximum": 58.5,
            "Unit": "Percent"
        },
        {
            "Timestamp": "2017-09-08T04:50:00Z",
            "Maximum": 58.7,
            "Unit": "Percent"
        },
        {
            "Timestamp": "2017-09-08T04:10:00Z",
            "Maximum": 58.5,
            "Unit": "Percent"
        }
    ],
    "Label": "JVMMemoryPressure"
}
```

## Metric: WriteIOPS

Getting Metrics for WriteIOPS, Every 10 Minutes for Max Statistic:

```bash
$ aws cloudwatch get-metric-statistics --namespace AWS/ES --dimensions Name=DomainName,Value=elasticsearch-cluster Name=ClientId,Value=123456789012 --metric-name WriteIOPS --start-time 2017-09-08T04:00:00 --end-time 2017-09-08T05:00:00 --period 600 --statistics Maximum
{
    "Datapoints": [
        {
            "Timestamp": "2017-09-08T04:30:00Z",
            "Maximum": 0.5266666666666666,
            "Unit": "Count/Second"
        },
        {
            "Timestamp": "2017-09-08T04:00:00Z",
            "Maximum": 0.0,
            "Unit": "Count/Second"
        },
        {
            "Timestamp": "2017-09-08T04:40:00Z",
            "Maximum": 0.09666666666666666,
            "Unit": "Count/Second"
        },
        {
            "Timestamp": "2017-09-08T04:10:00Z",
            "Maximum": 0.0,
            "Unit": "Count/Second"
        },
        {
            "Timestamp": "2017-09-08T04:50:00Z",
            "Maximum": 0.07,
            "Unit": "Count/Second"
        },
        {
            "Timestamp": "2017-09-08T04:20:00Z",
            "Maximum": 0.0,
            "Unit": "Count/Second"
        }
    ],
    "Label": "WriteIOPS"
}
```

## Metric: FreeStorageSpace

Getting Metrics for FreeStorageSpace in Megabytes:

```bash
$ aws cloudwatch get-metric-statistics --namespace AWS/ES --dimensions Name=DomainName,Value=elasticsearch-cluster Name=ClientId,Value=123456789012 --metric-name FreeStorageSpace --start-time 2017-09-11T05:00:00 --end-time 2017-09-11T06:00:00 --period 600 --statistics Minimum --unit Megabytes
{
    "Datapoints": [
        {
            "Timestamp": "2017-09-11T05:50:00Z",
            "Minimum": 25510.438,
            "Unit": "Megabytes"
        },
        {
            "Timestamp": "2017-09-11T05:10:00Z",
            "Minimum": 25573.032,
            "Unit": "Megabytes"
        },
        {
            "Timestamp": "2017-09-11T05:20:00Z",
            "Minimum": 25554.051,
            "Unit": "Megabytes"
        },
        {
            "Timestamp": "2017-09-11T05:30:00Z",
            "Minimum": 25540.957,
            "Unit": "Megabytes"
        },
        {
            "Timestamp": "2017-09-11T05:40:00Z",
            "Minimum": 25525.473,
            "Unit": "Megabytes"
        },
        {
            "Timestamp": "2017-09-11T05:00:00Z",
            "Minimum": 25584.383,
            "Unit": "Megabytes"
        }
    ],
    "Label": "FreeStorageSpace"
}
```
