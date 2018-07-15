---
layout: post
title: "Install Java Development Kit 10 on Ubuntu"
date: 2018-07-15 06:17:43 -0400
comments: true
categories: ["linux", "ubuntu", "java"]
---

With the announcement of improved docker container integration with Java 10, the JVM is now aware of resource constraints, as not from prior versions. More information on [this post](https://blog.docker.com/2018/04/improved-docker-container-integration-with-java-10/)

## Differences in Java 8 and Java 10:

As you can see with Java 8:

```bash
$ docker run -it -m512M --entrypoint bash openjdk:latest

$ docker-java-home/bin/java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
    uintx MaxHeapSize                              := 524288000                          {product}
openjdk version "1.8.0_162"
```

And with Java 10:

```bash
$ docker run -it -m512M --entrypoint bash openjdk:10-jdk

$ docker-java-home/bin/java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
   size_t MaxHeapSize                              = 134217728                                {product} {ergonomic}
openjdk version "10" 2018-03-20
```

## Installing JDK 10 on Ubuntu:

```bash
$ apt update && apt upgrade -y
$ add-apt-repository ppa:linuxuprising/java
$ apt update
$ apt install oracle-java10-installer
$ apt install oracle-java10-set-default
```

Confirming the Java Version:

```bash
$ java -version
java version "10.0.1" 2018-04-17
Java(TM) SE Runtime Environment 18.3 (build 10.0.1+10)
Java HotSpot(TM) 64-Bit Server VM 18.3 (build 10.0.1+10, mixed mode)
```
