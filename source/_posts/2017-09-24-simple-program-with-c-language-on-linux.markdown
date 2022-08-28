---
layout: post
title: "Simple Program with C Language on Linux"
date: 2017-09-24 06:41:58 -0400
comments: true
categories: ["linux", "programming", "code", "c"] 
---

Today the idea popped up on how to write a Simple "Hello World" Application using C Programming Language, as I just wanted to see how it works.

## Requirements:

You will need the `gcc` package to compile the program:

```bash RHEL
$ yum install gcc -y
```

```bash Debian
$ apt install gcc -y
```

## Writing our first Program:

We will create a app that just prints out a static defined value:

Create any file with a `.c` extension, in my case it will be `app.c`:

```c app.c
#include <stdio.h>

int main(){
    printf("Hello, World\n");
    return 0;
}
```

Now compile `app.c` with `gcc` and specify the output path of your app with `-o <app-name>`

```
$ gcc -o app app.c
```

## Testing our App:

You will see that there is a executable file with the name that you have specified as the output:

```
$ ./app
Hello, World
```

Really basic, but quite cool.
