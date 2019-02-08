---
layout: post
title: "Port Status Checker Script in C Language"
date: 2019-02-08 08:56:11 -0500
comments: true
categories: ["c", "code", "linux", "programming", "scripting"]
---

This is a simple script in the C Programming Language to test the port status of a remote address.

## Requirements:

You will need the gcc package to compile the program:

For RHEL based distro's: 

```bash
$ yum install gcc -y
```

For Debian based distro's:

```bash
$ apt install gcc -y
```

## Check TCP Port Status in C Language:

Our file: `test.c`

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>


int main(int argc, char *argv[]) {

    int portno     = 443;
    char *hostname = "google.com";

    int sockfd;
    struct sockaddr_in serv_addr;
    struct hostent *server;

    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
        error("Error opening socket\n");
    }

    server = gethostbyname(hostname);

    if (server == NULL) {
        fprintf(stderr,"ERROR, no such host\n");
        exit(0);
    }

    bzero((char *) &serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    bcopy((char *)server->h_addr,
         (char *)&serv_addr.sin_addr.s_addr,
         server->h_length);

    serv_addr.sin_port = htons(portno);
    if (connect(sockfd,(struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0) {
        printf("Port is Closed\n");
    } else {
        printf("Port is Open\n");
    }

    close(sockfd);
    return 0;
}
```

## Compile:

Compile using gcc:

```
$ gcc -o test test.c
```

## Execute:

Execute the script:

```bash
$ ./test
Port is Open
```
