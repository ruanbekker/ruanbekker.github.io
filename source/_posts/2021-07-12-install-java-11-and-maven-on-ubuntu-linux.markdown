---
layout: post
title: "Install Java 11 and Maven on Ubuntu Linux"
date: 2021-07-12 02:36:32 -0400
comments: true
categories: ["linux", "java", "maven"]
---

In this short tutorial I will show you how to prepare your environment for Java 11 and Maven on Ubuntu for Linux.

## Install

Update your package manager and install OpenJDK 11:

```bash
sudo apt update
sudo apt install openjdk-11-jdk -y
```

Verify that Java is installed:

```bash
$ java -version
openjdk version "11.0.11" 2021-04-20
OpenJDK Runtime Environment (build 11.0.11+9-Ubuntu-0ubuntu2.20.04)
OpenJDK 64-Bit Server VM (build 11.0.11+9-Ubuntu-0ubuntu2.20.04, mixed mode, sharing)
```

Once Java is installed, we can install Maven, first switch to the root user:

```bash
$ sudo su
```

I will be using maven version `3.6.2`, so adjust accordingly:

```bash
$ MAVEN_HOME="/opt/maven"
$ MAVEN_VERSION=3.6.3
$ MAVEN_CONFIG_HOME="/root/.m2"
```

Create the directories, then download maven and extract:

```bash
$ mkdir -p $MAVEN_HOME
$ curl -LSso /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz https://apache.org/dist/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.tar.gz
$ tar xzvf /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz -C $MAVEN_HOME --strip-components=1
$ rm /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz
$ update-alternatives --install /usr/bin/mvn mvn /opt/maven/bin/mvn 10000
$ mkdir -p $MAVEN_CONFIG_HOME
```

Set the environment variables for maven:

```bash
$ cat /etc/profile.d/custom.sh
#!/bin/bash
export MAVEN_HOME="/opt/maven"
export MAVEN_VERSION=3.6.3
export MAVEN_CONFIG_HOME="/root/.m2"
```

Then make the file executable:

```bash
$ chmod +x /etc/profile.d/custom.sh
```

Verify that maven is installed:

```bash
$ mvn -version
Apache Maven 3.6.3 (cecedd343002696d0abb50b32b541b8a6ba2883f)
Maven home: /opt/maven
Java version: 11.0.11, vendor: Ubuntu, runtime: /usr/lib/jvm/java-11-openjdk-amd64
Default locale: en, platform encoding: UTF-8
OS name: "linux", version: "5.4.0-1041-aws", arch: "amd64", family: "unix"
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

