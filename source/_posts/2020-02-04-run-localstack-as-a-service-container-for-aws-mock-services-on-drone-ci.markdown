---
layout: post
title: "Run Localstack as a Service Container for AWS Mock Services on Drone CI"
date: 2020-02-04 23:43:30 +0200
comments: true
categories: ["aws", "localstack", "drone", "devops", "cicd"]
---

In this tutorial we will setup a basic pipeline in drone to make use of service containers, we will provision localstack so that we can provision AWS mock services.

We will create a kinesis stream on localstack, when the service is up, we will create a stream, put 100 records in the stream, read them from the stream and delete the kinesis stream.

## Gitea and Drone Stack

If you don’t have the stack setup, have a look at [this post](https://blog.ruanbekker.com/blog/2020/02/04/setup-gitea-and-drone-on-docker-2020-edition/) where I go into detail on how to get that setup.

## Create the Drone Config

In gitea, I have created a new git repository and created my drone config as `.drone.yml` with this pipeline config:

```
---
kind: pipeline
type: docker
name: localstack

platform:
  os: linux
  arch: amd64

steps:
  - name: wait-for-localstack
    image: busybox
    commands:
      - sleep 10

  - name: list-kinesis-streams
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - aws --endpoint-url=http://localstack:4568 kinesis list-streams

  - name: create-kinesis-streams
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - aws --endpoint-url=http://localstack:4568 kinesis create-stream --stream-name mystream --shard-count 1

  - name: describe-kinesis-streams
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - aws --endpoint-url=http://localstack:4568 kinesis describe-stream --stream-name mystream

  - name: put-record-into-kinesis
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - for record in $$(seq 1 100); do aws --endpoint-url=http://localstack:4568 kinesis put-record --stream-name mystream --partition-key 123 --data testdata_$$record ; done

  - name: get-record-from-kinesis
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - SHARD_ITERATOR=$$(aws --endpoint-url=http://localstack:4568 kinesis get-shard-iterator --shard-id shardId-000000000000 --shard-iterator-type TRIM_HORIZON --stream-name mystream --query 'ShardIterator' --output text)
      - for each in $$(aws --endpoint-url=http://localstack:4568 kinesis get-records --shard-iterator $$SHARD_ITERATOR | jq -cr '.Records[].Data'); do echo $each | base64 -d ; echo "" ; done

  - name: delete-kinesis-stream
    image: ruanbekker/awscli
    environment:
      AWS_ACCESS_KEY_ID: 123
      AWS_SECRET_ACCESS_KEY: xyz
      AWS_DEFAULT_REGION: eu-west-1
    commands:
      - aws --endpoint-url=http://localstack:4568 kinesis delete-stream --stream-name mystream

services:
  - name: localstack
    image: localstack/localstack
    privileged: true
    environment:
      DOCKER_HOST: unix:///var/run/docker.sock
    volumes:
      - name: docker-socket
        path: /var/run/docker.sock
      - name: localstack-vol
        path: /tmp/localstack
    ports:
      - 8080

volumes:
- name: localstack-vol
  temp: {}
- name: docker-socket
  host:
    path: /var/run/docker.sock
```

To explain what we are doing, we are bringing up localstack as a service container, then using the aws cli tools we point to the localstack kinesis endpoint, creating a kinesis stream, put 100 records to the stream, then we read from the stream and delete thereafter.

## Trigger the Pipeline

Then I head to drone activate my new git repository and select the repository as "Trusted". I commited a dummy file to trigger the pipeline and it should look like this:

<img width="893" alt="image" src="https://user-images.githubusercontent.com/567298/73788817-63a32180-47a6-11ea-96c7-6abba7af2b27.png">

List Streams:

<img width="974" alt="image" src="https://user-images.githubusercontent.com/567298/73788860-73bb0100-47a6-11ea-9c80-f2b8bfc18d53.png">

Put Records:

<img width="896" alt="image" src="https://user-images.githubusercontent.com/567298/73788895-87666780-47a6-11ea-8d90-2c454ec9174a.png">

Delete Stream:

<img width="924" alt="image" src="https://user-images.githubusercontent.com/567298/73788988-aebd3480-47a6-11ea-85d9-9ed7424c648b.png">

