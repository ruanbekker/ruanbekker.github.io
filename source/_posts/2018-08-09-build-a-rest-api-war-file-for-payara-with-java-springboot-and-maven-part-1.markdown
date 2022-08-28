---
layout: post
title: "Build a REST API war file for Payara with Java Springboot and Maven Part 1"
date: 2018-08-09 20:43:34 -0400
comments: true
categories: ["java", "api", "payara", "springboot", "maven", "war", "docker", "hello-world", "web-development"]
---

![](https://objects.ruanbekker.com/assets/images/payara-logo.png)

This is a command line approach to create a java web app for payara that takes war files, which we will be using in conjunction with springboot and apache maven.

## Setup Java and Apache Maven:

Setup Java 1.8:

```bash
$ apt update
$ apt install wget openssl vim software-properties-common -y
$ add-apt-repository ppa:webupd8team/java -y
$ apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C2518248EEA14886
$ apt update && apt install oracle-java8-installer -y
```

Setup Apache Maven:

```bash
$ cd /opt
$ curl -SL  http://www-eu.apache.org/dist/maven/maven-3/3.5.4/binaries/apache-maven-3.5.4-bin.tar.gz | tar -xz
$ mv apache-maven-3.5.4 maven
$ echo 'M2_HOME=/opt/maven' > /etc/profile.d/mavenenv.sh
$ echo 'export PATH=${M2_HOME}/bin:${PATH}' >> /etc/profile.d/mavenenv.sh
$ chmod +x /etc/profile.d/mavenenv.sh
$ source /etc/profile.d/mavenenv.sh
```

Ensure Java and Maven is installed:

```bash
$ java -version
java version "1.8.0_181"

$ mvn -version
Apache Maven 3.5.4
```

## Prepare the directories:

Prepare the directories where we will be working with our application's source code:

```bash
$ mkdir -p /root/app
$ cd /root/app
$ mkdir -p src/main/webapp/WEB-INF
$ mkdir -p src/main/java/fish/payara/spring/boot/{controller,domain}
```

## The source code:

The `pom.xml` file:

```bash
$ vim pom.xml
```

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>fish.payara.appserver</groupId>
    <artifactId>payara-micro-with-spring-boot-rest</artifactId>
    <version>1.0</version>
    <packaging>war</packaging>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <compilerArguments>
                        <source>1.8</source>
                        <target>1.8</target>
                    </compilerArguments>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>1.2.6.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-tomcat</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

    <dependency>
        <groupId>org.springframework.batch</groupId>
        <artifactId>spring-batch-test</artifactId>
        <scope>import</scope>
    </dependency>

        <dependency>
            <groupId>org.crsh</groupId>
            <artifactId>crsh.plugins</artifactId>
            <version>1.2.11</version>
            <type>pom</type>
        </dependency>

        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>3.1.0</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

The `web.xml`:

```bash
$ vim src/main/webapp/WEB-INF/web.xml
```
```xml
<web-app
    xmlns="http://xmlns.jcp.org/xml/ns/javaee" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaeehttp://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
    version="3.1">

</web-app>
```

The `Application.java`:

```bash
$ vim src/main/java/fish/payara/spring/boot/Application.java
```

```java
package fish.payara.spring.boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;

@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }

    public static void main(String[] args) throws Exception {
        SpringApplication.run(Application.class, args);
    }
}
```

The `Person.java`:

```bash
$ vim src/main/java/fish/payara/spring/boot/domain/Person.java
```
```java
package fish.payara.spring.boot.domain;

public class Person {

    private int id;
    private String name;
    private String lastName;
    private String email;

    public Person() {
    }

    public Person(int id, String name, String lastName, String email) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.email = email;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
```

The `PersonRestController.java`:

```bash
$ src/main/java/fish/payara/spring/boot/controller/PersonRestController.java
```

```java
package fish.payara.spring.boot.controller;

import fish.payara.spring.boot.domain.Person;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/person")
public class PersonRestController {

    Map<Integer, Person> personMap = new HashMap<>();

    @PostConstruct
    public void init() {
        personMap.put(1, new Person(1, "Ruan", "Bekker", "ruan@gmail.com"));
        personMap.put(2, new Person(2, "Steve", "James", "steve@gmail.com"));
        personMap.put(3, new Person(3, "Frank", "Phillips", "frank@gmail.com"));
    }

    @RequestMapping("/all")
    public Collection<Person> getAll() {
        return personMap.values();
    }
}
```

## Build with Maven:

Build the war file with maven:

```bash
$ mvn clean package

[INFO] Packaging webapp
[INFO] Assembling webapp [payara-micro-with-spring-boot-rest] in [/root/app/target/payara-micro-with-spring-boot-rest-1.0]
[INFO] Processing war project
[INFO] Copying webapp resources [/root/app/src/main/webapp]
[INFO] Webapp assembled in [113 msecs]
[INFO] Building war: /root/app/target/payara-micro-with-spring-boot-rest-1.0.war
[INFO] WEB-INF/web.xml already added, skipping
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 18.662 s
[INFO] Finished at: 2018-08-04T10:46:50Z
[INFO] ------------------------------------------------------------------------
```

You will find your war file under:

```bash
$ ls target/
classes  maven-archiver  maven-status  payara-micro-with-spring-boot-rest-1.0  payara-micro-with-spring-boot-rest-1.0.war
```

You can change the name in the `pom.xml`, but since we already built it, lets rename the file to something shorter:

```bash
$ mv /root/app/target/payara-micro-with-spring-boot-rest-1.0.war /root/app/target/webapp.war
```

## Deploy your Application with Payara Micro:

Deploy your application with docker:

```bash
$ docker run -it -p 8080:8080 -v /root/app/target:/opt/payara/deployments payara/micro --deploy /opt/payara/deployments/webapp.war


  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v1.2.6.RELEASE)

{
    "Instance Configuration": {
        "Host": "4e90ecf6a1a7",
        "Http Port(s)": "8080",
        "Https Port(s)": "",
        "Instance Name": "Cloudy-Chub",
        "Instance Group": "MicroShoal",
        "Hazelcast Member UUID": "a1af817d-473b-4fa7-9ee9-7d53291a35a2",
        "Deployed": [
            {
                "Name": "webapp",
                "Type": "war",
                "Context Root": "/webapp"
            }
        ]
    }
}
2018-08-04 11:26:39.655  INFO 1 --- [           main] PayaraMicro                              :
Payara Micro URLs:
http://4e90ecf6a1a7:8080/webapp
```

## Testing

Let's hit our app's health endpoint to test:

```bash
$ curl -s http://localhost:8080/webapp/health | jq .
{
  "status": "UP"
}
```

Now to interact with our API:

```bash
$ curl -s http://localhost:8080/webapp/person/all | jq .
[
  {
    "id": 1,
    "name": "Ruan",
    "lastName": "Bekker",
    "email": "ruan@gmail.com"
  },
  {
    "id": 2,
    "name": "Steve",
    "lastName": "James",
    "email": "steve@gmail.com"
  },
  {
    "id": 3,
    "name": "Frank",
    "lastName": "Phillips",
    "email": "frank@gmail.com"
  }
]
```

Payara also provides a `/metrics` endpoint:

```bash
$ curl -s http://localhost:8080/webapp/metrics | jq .
{
  "mem": 219648,
  "mem.free": 67104,
  "processors": 4,
  "instance.uptime": 369749,
  "uptime": 390417,
  "systemload.average": 0.14697265625,
  "heap.committed": 219648,
  "heap.init": 32768,
  "heap.used": 152543,
  "heap": 455168,
  "threads.peak": 98,
  "threads.daemon": 37,
  "threads": 72,
  "classes": 16951,
  "classes.loaded": 16951,
  "classes.unloaded": 0,
  "gc.ps_scavenge.count": 42,
  "gc.ps_scavenge.time": 515,
  "gc.ps_marksweep.count": 4,
  "gc.ps_marksweep.time": 634,
  "counter.status.200.health": 1,
  "counter.status.200.mappings": 2,
  "counter.status.200.person.all": 2,
  "counter.status.404.error": 5,
  "gauge.response.error": 6,
  "gauge.response.health": 120,
  "gauge.response.mappings": 3,
  "gauge.response.person.all": 9
}
```

And to get a mapping of all the endpoints:

```bash
$ curl -s http://localhost:8080/webapp/mappings | jq .
```

If you decided to deploy as a jar, you can use the payara-micro jar to deploy the war file:

```bash
$ java -jar payara-micro-5.182.jar --deploy target/webapp.war
```

For more info on this, have a look at their [website](https://blog.payara.fish/creating-rest-web-services-with-spring-boot-hosted-on-payara-micro)
