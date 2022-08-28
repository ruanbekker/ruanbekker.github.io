---
layout: post
title: "Hello World Web App with Java Springboot and Maven"
date: 2018-08-03 08:31:58 -0400
comments: true
categories: ["java", "maven", "hello-world", "springboot", "ubuntu"] 
---

In this post we will setup a Java Hello World Web App, using Maven and SpringBoot on Ubuntu 16. I will create all the needed files in this tutorial, but you can head to start.spring.io to generate the zip for you.

## Setup Java

Setup Java 1.8:

```bash
$ apt update
$ apt install wget openssl vim software-properties-common -y
$ add-apt-repository ppa:webupd8team/java -y
$ apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C2518248EEA14886
$ apt update && apt install oracle-java8-installer -y
```

Ensure that Java is installed:

```bash
$ java -version
java version "1.8.0_181"
Java(TM) SE Runtime Environment (build 1.8.0_181-b13)
Java HotSpot(TM) 64-Bit Server VM (build 25.181-b13, mixed mode)
```

## Install Apache Maven:

Maven is a build automation tool used primarily for Java projects. Let's setup Maven:

```
$ cd /opt
$ curl -SL  http://www-eu.apache.org/dist/maven/maven-3/3.5.4/binaries/apache-maven-3.5.4-bin.tar.gz | tar -xz
$ mv apache-maven-3.5.4 maven
$ echo 'M2_HOME=/opt/maven' > /etc/profile.d/mavenenv.sh
$ echo 'export PATH=${M2_HOME}/bin:${PATH}' >> /etc/profile.d/mavenenv.sh
$ chmod +x /etc/profile.d/mavenenv.sh
$ source /etc/profile.d/mavenenv.sh
```

Verify that Maven is installed:

```
$ mvn -version
Apache Maven 3.5.4 (1edded0938998edf8bf061f1ceb3cfdeccf443fe; 2018-06-17T18:33:14Z)
Maven home: /opt/maven
Java version: 1.8.0_181, vendor: Oracle Corporation, runtime: /usr/lib/jvm/java-8-oracle/jre
Default locale: en_US, platform encoding: ANSI_X3.4-1968
OS name: "linux", version: "4.9.87-linuxkit-aufs", arch: "amd64", family: "unix"
```

## Setup the Application:

Create the home directory:

```bash
$ mkdir myapp && cd myapp
```

Create the directory structure:

```bash
$ mkdir -p src/main/java/hello
```

Create and Edit the pom.xml:

```
$ vim pom.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>hello</groupId>
    <artifactId>myapp</artifactId>
    <version>1.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.9.RELEASE</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

Create the Main Application Class:

```bash
$ vim src/main/java/hello/MainApplicationClass.java
```
```java
package hello;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MainApplicationClass {

    public static void main(String[] args) {
        SpringApplication.run(MainApplicationClass.class, args);
    }
}
```

Create the Route Controller:

```bash
$ vim src/main/java/hello/HelloController.java
```

```java
package hello;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @RequestMapping("/")
        public String index() {
	    return "This is the index!\n";
	}
    @RequestMapping("/hello")
        public String index2() {

	    return "Hello, World!\n";
	}

}
```

## Build and Compile:

This will download all the dependencies and build the jar file:

```bash
$ mvn clean package
```

## Start and Test the Application:

Run the application:

```bash
$ java -jar target/myapp-1.0.jar

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v1.5.9.RELEASE)
...
2018-08-03 12:31:06.967  INFO 5594 --- [           main] hello.MainApplicationClass               : Started MainApplicationClass in 3.656 seconds (JVM running for 4.243)
^
```

Test the Application:

```bash
$ curl http://localhost:8080/
This is the index!
```

And for our `/hello` route:

```bash
$ curl http://localhost:8080/hello
Hello, World!
```


