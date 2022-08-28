---
layout: post
title: "Running Java Web Applications on Tomcat with Docker Swarm"
date: 2017-10-24 09:37:38 -0400
comments: true
categories: ["docker", "docker-swarm", "java", "tomcat", "webapps"] 
---

From [this post](https://sysadmins.co.za/running-java-web-applications-on-docker-with-payara-micro/?referral=blog.ruanbekker.com?category=java) we used Payara Micro to Setup a Web Application, and a full example was provided on how to create a `war` file that will be used for the deployment.

Today we will be using Tomcat to deploy the same application. The official repository can be found on [hub.docker.com/_/tomcat](https://hub.docker.com/_/tomcat/) .

## Our Dockerfile for our Own Tomcat Image:

The `Dockerfile` is modified a bit (CATALINA_OPTS) to be able to pass `JVM` environment variables, but if you would like to use the standard image you can skip this and just use the image from their repository.

```bash
FROM openjdk:8-jre-alpine

ENV CATALINA_HOME /usr/local/tomcat
ENV PATH $CATALINA_HOME/bin:$PATH
RUN mkdir -p "$CATALINA_HOME"
WORKDIR $CATALINA_HOME
ENV CATALINA_OPTS -Xmx768m -Xms512m -XX:PermSize=256m -XX:MaxPermSize=512m -XX:ReservedCodeCacheSize=64m -XX:+UseG1GC -XX:+CMSClassUnloadingEnabled -XX:+PrintHeapAtGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps
# let "Tomcat Native" live somewhere isolated
ENV TOMCAT_NATIVE_LIBDIR $CATALINA_HOME/native-jni-lib
ENV LD_LIBRARY_PATH ${LD_LIBRARY_PATH:+$LD_LIBRARY_PATH:}$TOMCAT_NATIVE_LIBDIR

RUN apk add --no-cache gnupg

# see https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/KEYS
# see also "update.sh" (https://github.com/docker-library/tomcat/blob/master/update.sh)
ENV GPG_KEYS 05AB33110949707C93A279E3D3EFE6B686867BA6 07E48665A34DCAFAE522E5E6266191C37C037D42 47309207D818FFD8DCD3F83F1931D684307A10A5 541FBE7D8F78B25E055DDEE13C370389288584E7 61B832AC2F1C5A90F0F9B00A1C506407564C17A3 713DA88BE50911535FE716F5208B0AB1D63011C7 79F7026C690BAA50B92CD8B66A3AD3F4F22C4FED 9BA44C2621385CB966EBA586F72C284D731FABEE A27677289986DB50844682F8ACB77FC2E86E29AC A9C5DF4D22E99998D9875A5110C01C5A2F6059E7 DCFD35E0BF8CA7344752DE8B6FB21E8933C60243 F3A04C595DB5B6A5F1ECA43E3B7BBB100D811BBE F7DA48BB64BCB84ECBA7EE6935CD23C10D498E23
RUN set -ex; \
	for key in $GPG_KEYS; do \
		gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
	done

ENV TOMCAT_MAJOR 8
ENV TOMCAT_VERSION 8.5.23
ENV TOMCAT_SHA1 1ba27c1bb86ab9c8404e98068800f90bd662523c

ENV TOMCAT_TGZ_URLS \
# https://issues.apache.org/jira/browse/INFRA-8753?focusedCommentId=14735394#comment-14735394
	https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz \
# if the version is outdated, we might have to pull from the dist/archive :/
	https://www-us.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz \
	https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz \
	https://archive.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz

ENV TOMCAT_ASC_URLS \
	https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz.asc \
# not all the mirrors actually carry the .asc files :'(
	https://www-us.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz.asc \
	https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz.asc \
	https://archive.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz.asc

RUN set -eux; \
	\
	apk add --no-cache --virtual .fetch-deps \
		ca-certificates \
		openssl \
	; \
	\
	success=; \
	for url in $TOMCAT_TGZ_URLS; do \
		if wget -O tomcat.tar.gz "$url"; then \
			success=1; \
			break; \
		fi; \
	done; \
	[ -n "$success" ]; \
	\
	echo "$TOMCAT_SHA1 *tomcat.tar.gz" | sha1sum -c -; \
	\
	success=; \
	for url in $TOMCAT_ASC_URLS; do \
		if wget -O tomcat.tar.gz.asc "$url"; then \
			success=1; \
			break; \
		fi; \
	done; \
	[ -n "$success" ]; \
	\
	gpg --batch --verify tomcat.tar.gz.asc tomcat.tar.gz; \
	tar -xvf tomcat.tar.gz --strip-components=1; \
	rm bin/*.bat; \
	rm tomcat.tar.gz*; \
	\
	nativeBuildDir="$(mktemp -d)"; \
	tar -xvf bin/tomcat-native.tar.gz -C "$nativeBuildDir" --strip-components=1; \
	apk add --no-cache --virtual .native-build-deps \
		apr-dev \
		coreutils \
		dpkg-dev dpkg \
		gcc \
		libc-dev \
		make \
		"openjdk${JAVA_VERSION%%[-~bu]*}"="$JAVA_ALPINE_VERSION" \
		openssl-dev \
	; \
	( \
		export CATALINA_HOME="$PWD"; \
		cd "$nativeBuildDir/native"; \
		gnuArch="$(dpkg-architecture --query DEB_BUILD_GNU_TYPE)"; \
		./configure \
			--build="$gnuArch" \
			--libdir="$TOMCAT_NATIVE_LIBDIR" \
			--prefix="$CATALINA_HOME" \
			--with-apr="$(which apr-1-config)" \
			--with-java-home="$(docker-java-home)" \
			--with-ssl=yes; \
		make -j "$(nproc)"; \
		make install; \
	); \
	runDeps="$( \
		scanelf --needed --nobanner --format '%n#p' --recursive "$TOMCAT_NATIVE_LIBDIR" \
			| tr ',' '\n' \
			| sort -u \
			| awk 'system("[ -e /usr/local/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
	)"; \
	apk add --virtual .tomcat-native-rundeps $runDeps; \
	apk del .fetch-deps .native-build-deps; \
	rm -rf "$nativeBuildDir"; \
	rm bin/tomcat-native.tar.gz; \
	\
# sh removes env vars it doesn't support (ones with periods)
# https://github.com/docker-library/tomcat/issues/77
	apk add --no-cache bash; \
	find ./bin/ -name '*.sh' -exec sed -ri 's|^#!/bin/sh$|#!/usr/bin/env bash|' '{}' +

# verify Tomcat Native is working properly
RUN set -e \
	&& nativeLines="$(catalina.sh configtest 2>&1)" \
	&& nativeLines="$(echo "$nativeLines" | grep 'Apache Tomcat Native')" \
	&& nativeLines="$(echo "$nativeLines" | sort -u)" \
	&& if ! echo "$nativeLines" | grep 'INFO: Loaded APR based Apache Tomcat Native library' >&2; then \
		echo >&2 "$nativeLines"; \
		exit 1; \
	fi

EXPOSE 8080
CMD ["catalina.sh", "run"]
``` 

## Building our Image and Pusing to our Registry:

```bash
$ docker build -t registry.gitlab.com/<user>/<repo>/<image>:<tag>
$ docker push registry.gitlab.com/<user>/<repo>/<image>:<tag>
```

## Dockerfile for our Application:

Now that we have built our image for Tomcat, we can write our `Dockerfile` for our application, note that the `hello.war` file also needs to be in the same working directory, unless written otherwise:

```docker
FROM registry.gitlab.com/<user>/<repo>/<image>:<tag>
COPY hello.war /usr/local/tomcat/webapps/hello.war
```

## Setup the Compose file for our Stack:

We will use docker stack to deploy our application, note that I have [Traefik](https://sysadmins.co.za/traefik-a-modern-http-reverse-proxy-and-load-balancer-for-microservices-such-as-docker/) that acts as my reverse proxy.

Below, our `app.yml` compose file:

```yml
version: '3'

services:
  hello:
    image: registry.gitlab.com/<user>/<repo>/<image>:<tag>
    networks:
      - appnet
    deploy:
      labels:
        - "traefik.port=8080"
        - "traefik.docker.network=appnet"
        - "traefik.frontend.rule=Host:apps.mydomain.com; PathPrefix: /hello/"
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - 'node.role==worker'

networks:
  appnet:
    external: true
```

## Deploy our Application:

From our compose file we defined that our network is external, so if you are using the same name, and you have not yet setup the overlay network:

```bash
$ docker network create --driver overlay appnet
```

Now deploy the stack:

```bash
$ docker stack deploy --compose-file app.yml apps
```

## Testing our Application:

```bash
$ curl http://apps.mydomain.com/hello/

<!DOCTYPE html>
<html>
            Hello World!
   Test Page with Docker + Payara Micro</h3>

   Serving From ContainerId: d24f8cd982fc
</html>
```
