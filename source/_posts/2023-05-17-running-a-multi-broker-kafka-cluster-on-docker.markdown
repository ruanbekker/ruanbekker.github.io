---
layout: post
title: "Running a Multi-Broker Kafka Cluster on Docker"
date: 2023-05-17 10:50:57 -0400
comments: true
categories: ["docker", "kafka"]
---

In this post we will run a [Kakfa](https://kafka.apache.org/) cluster with 3 kafka brokers on docker compose and using a producer to send messages to our topics and a consumer that will receive the messages from the topics, which we will develop in python and explore the [kafka-ui](https://github.com/provectus/kafka-ui). 

## What is Kafka?

Kafka is a distributed event store and stream processing platform. Kafka is used to build real-time streaming data pipelines and real-time streaming applications.

This is a fantastic resource if you want to understand the components better in detail:
- [apache-kafka-architecture-what-you-need-to-know](https://www.upsolver.com/blog/apache-kafka-architecture-what-you-need-to-know)

But on a high level, the components of a typical Kafka setup:

1. Zookeeper: Kafka relies on Zookeeper to do leadership election of Kafka Brokers and Topic Partitions.
2. Broker: Kafka server that receives messages from producers, assigns them to offsets and commit the messages to disk storage. A offset is used for data consistency in a event of failure, so that consumers know from where to consume from their last message.
3. Topic: A topic can be thought of categories to organize messages. Producers writes messages to topics, consumers reads from those topics.
4. Partitions: A topic is split into multiple partitions. This improves scalability through parallelism (not just one broker). Kafka also does replication

For great in detail information about kafka and its components, I encourage you to visit the [mentioned post](https://www.upsolver.com/blog/apache-kafka-architecture-what-you-need-to-know) from above. 

## Launch Kafka

This is the `docker-compose.yaml` that we will be using to run a kafka cluster with 3 broker containers, 1 zookeeper container, 1 producer, 1 consumer and a kafka-ui.

All the source code is available on my [quick-starts github repository](https://github.com/ruanbekker/quick-starts/tree/main/docker/kafka) .

```yaml
version: "3.9"

services:
  zookeeper:
    platform: linux/amd64
    image: confluentinc/cp-zookeeper:${CONFLUENT_PLATFORM_VERSION:-7.4.0}
    container_name: zookeeper
    restart: unless-stopped
    ports:
      - '32181:32181'
      - '2888:2888'
      - '3888:3888'
    environment:
      ZOOKEEPER_SERVER_ID: 1
      ZOOKEEPER_CLIENT_PORT: 32181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_INIT_LIMIT: 5
      ZOOKEEPER_SYNC_LIMIT: 2
      ZOOKEEPER_SERVERS: zookeeper:2888:3888
    healthcheck:
      test: echo stat | nc localhost 32181
      interval: 10s
      timeout: 10s
      retries: 3
    networks:
      - kafka
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  kafka-ui: 
    container_name: kafka-ui 
    image: provectuslabs/kafka-ui:latest
    ports:
      - 8080:8080
    depends_on:
      - broker-1
      - broker-2
      - broker-3
    environment:
      KAFKA_CLUSTERS_0_NAME: broker-1
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: broker-1:29091
      KAFKA_CLUSTERS_0_METRICS_PORT: 19101
      KAFKA_CLUSTERS_1_NAME: broker-2
      KAFKA_CLUSTERS_1_BOOTSTRAPSERVERS: broker-2:29092
      KAFKA_CLUSTERS_1_METRICS_PORT: 19102
      KAFKA_CLUSTERS_2_NAME: broker-3
      KAFKA_CLUSTERS_2_BOOTSTRAPSERVERS: broker-3:29093
      KAFKA_CLUSTERS_2_METRICS_PORT: 19103
      DYNAMIC_CONFIG_ENABLED: 'true'
    networks:
      - kafka
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  broker-1:
    platform: linux/amd64
    image: confluentinc/cp-kafka:${CONFLUENT_PLATFORM_VERSION:-7.4.0}
    container_name: broker-1
    restart: unless-stopped
    ports:
      - '9091:9091'
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:32181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://broker-1:29091,EXTERNAL://localhost:9091
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_NUM_PARTITIONS: 3
      KAFKA_JMX_PORT: 19101
      KAFKA_JMX_HOSTNAME: localhost
    healthcheck:
      test: nc -vz localhost 9091
      interval: 10s
      timeout: 10s
      retries: 3
    networks:
      - kafka
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  broker-2:
    platform: linux/amd64
    image: confluentinc/cp-kafka:${CONFLUENT_PLATFORM_VERSION:-7.4.0}
    container_name: broker-2
    restart: unless-stopped
    ports:
      - '9092:9092'
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:32181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://broker-2:29092,EXTERNAL://localhost:9092
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_NUM_PARTITIONS: 3
      KAFKA_JMX_PORT: 19102
      KAFKA_JMX_HOSTNAME: localhost
    healthcheck:
      test: nc -vz localhost 9092
      interval: 10s
      timeout: 10s
      retries: 3
    networks:
      - kafka
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  broker-3:
    platform: linux/amd64
    image: confluentinc/cp-kafka:${CONFLUENT_PLATFORM_VERSION:-7.4.0}
    container_name: broker-3
    restart: unless-stopped
    ports:
      - '9093:9093'
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:32181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://broker-3:29093,EXTERNAL://localhost:9093
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_NUM_PARTITIONS: 3
      KAFKA_JMX_PORT: 19103
      KAFKA_JMX_HOSTNAME: localhost
    healthcheck:
      test: nc -vz localhost 9093
      interval: 10s
      timeout: 10s
      retries: 3
    networks:
      - kafka
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
  
  producer:
    platform: linux/amd64
    container_name: producer
    image: ruanbekker/kafka-producer-consumer:2023-05-17
    # source: https://github.com/ruanbekker/quick-starts/tree/main/docker/kafka/python-client
    restart: always
    environment:
      - ACTION=producer
      - BOOTSTRAP_SERVERS=broker-1:29091,broker-2:29092,broker-3:29093
      - TOPIC=my-topic
      - PYTHONUNBUFFERED=1 # https://github.com/docker/compose/issues/4837#issuecomment-302765592
    networks:
      - kafka
    depends_on:
      - zookeeper
      - broker-1
      - broker-2
      - broker-3
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

  consumer:
    platform: linux/amd64
    container_name: consumer
    image: ruanbekker/kafka-producer-consumer:2023-05-17
    # source: https://github.com/ruanbekker/quick-starts/tree/main/docker/kafka/python-client
    restart: always
    environment:
      - ACTION=consumer
      - BOOTSTRAP_SERVERS=broker-1:29091,broker-2:29092,broker-3:29093
      - TOPIC=my-topic
      - CONSUMER_GROUP=cg-group-id
      - PYTHONUNBUFFERED=1 # https://github.com/docker/compose/issues/4837#issuecomment-302765592
    networks:
      - kafka
    depends_on:
      - zookeeper
      - broker-1
      - broker-2
      - broker-3
      - producer
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

networks:
  kafka:
    name: kafka
```

**Note**: This docker-compose yaml can be found in my [kafka quick-starts](https://github.com/ruanbekker/quick-starts/tree/main/docker/kafka) repository.

In our compose file we defined our core stack:

- 1 Zookeeper Container
- 3 Kafka Broker Containers
- 1 Kafka UI

Then we have our clients:

- 1 Producer that will send messages to our topics (source code: https://github.com/ruanbekker/quick-starts/blob/main/docker/kafka/python-client/produce.py )
- 1 Consumer that will read the messages from our topics (source code: https://github.com/ruanbekker/quick-starts/blob/main/docker/kafka/python-client/consume.py )

We can boot the stack with:

```bash
docker-compose up -d
```

You can verify that the brokers are passing their health checks with:

```bash
docker-compose ps

NAME                IMAGE                                           COMMAND                  SERVICE             CREATED             STATUS                   PORTS
broker-1            confluentinc/cp-kafka:7.4.0                     "/etc/confluent/dock…"   broker-1            5 minutes ago       Up 4 minutes (healthy)   0.0.0.0:9091->9091/tcp, :::9091->9091/tcp, 9092/tcp
broker-2            confluentinc/cp-kafka:7.4.0                     "/etc/confluent/dock…"   broker-2            5 minutes ago       Up 4 minutes (healthy)   0.0.0.0:9092->9092/tcp, :::9092->9092/tcp
broker-3            confluentinc/cp-kafka:7.4.0                     "/etc/confluent/dock…"   broker-3            5 minutes ago       Up 4 minutes (healthy)   9092/tcp, 0.0.0.0:9093->9093/tcp, :::9093->9093/tcp
consumer            ruanbekker/kafka-producer-consumer:2023-05-17   "sh /src/run.sh $ACT…"   consumer            5 minutes ago       Up 4 minutes
kafka-ui            provectuslabs/kafka-ui:latest                   "/bin/sh -c 'java --…"   kafka-ui            5 minutes ago       Up 4 minutes             0.0.0.0:8080->8080/tcp, :::8080->8080/tcp
producer            ruanbekker/kafka-producer-consumer:2023-05-17   "sh /src/run.sh $ACT…"   producer            5 minutes ago       Up 4 minutes
zookeeper           confluentinc/cp-zookeeper:7.4.0                 "/etc/confluent/dock…"   zookeeper           5 minutes ago       Up 5 minutes (healthy)   0.0.0.0:2888->2888/tcp, :::2888->2888/tcp, 0.0.0.0:3888->3888/tcp, :::3888->3888/tcp, 2181/tcp, 0.0.0.0:32181->32181/tcp, :::32181->32181/tcp
```

## Producers and Consumers

The producer generates random data and sends it to a topic, where the consumer will listen on the same topic and read messages from that topic.

To view the output of what the `producer` is doing, you can tail the logs:

```bash
docker logs -f producer

setting up producer, checking if brokers are available
brokers not available yet
brokers are available and ready to produce messages
message sent to kafka with squence id of 1
message sent to kafka with squence id of 2
message sent to kafka with squence id of 3
```

And to view the output of what the `consumer` is doing, you can tail the logs:

```bash
docker logs -f consumer

starting consumer, checks if brokers are availabe
brokers not availbe yet
brokers are available and ready to consume messages
{'sequence_id': 10, 'user_id': '20520', 'transaction_id': '4026fd10-2aca-4d2e-8bd2-8ef0201af2dd', 'product_id': '17974', 'address': '71741 Lopez Throughway | South John | BT', 'signup_at': '2023-05-11 06:54:52', 'platform_id': 'Tablet', 'message': 'transaction made by userid 119740995334901'}
{'sequence_id': 11, 'user_id': '78172', 'transaction_id': '4089cee1-0a58-4d9b-9489-97b6bc4b768f', 'product_id': '21477', 'address': '735 Jasmine Village Apt. 009 | South Deniseland | BN', 'signup_at': '2023-05-17 09:54:10', 'platform_id': 'Tablet', 'message': 'transaction made by userid 159204336307945'}
```

## Kafka UI

The Kafka UI will be available on [http://localhost:8080](http://localhost:8080)

Where we can view lots of information, but in the below screenshot we can see our topics:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/5da40db5-a56a-4c7b-8f8c-929568e9eb81)

And when we look at the `my-topic`, we can see a overview dashboard of our topic information:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/f9feb32f-5828-41a5-91f5-9d614feb8e7c)

We can also look at the messages in our topic, and also search for messages:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/48f58970-d665-4bd5-8e76-5a770e885993)

And we can also look at the current consumers:

![image](https://github.com/ruanbekker/ruanbekker.github.io/assets/567298/68a25d64-9899-4073-ae02-76becc4c149a)

## Resources

My Quick-Starts Github Repository:

- https://github.com/ruanbekker/quick-starts

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon


