---
layout: post
title: "Using if statements in bash to check if environment variables exist"
date: 2020-08-14 11:00:25 +0000
comments: true
categories: ["bash"] 
---

This is a quick post to demonstrate how to use **if statements** in bash to check if we have the required environment variables in our environment before we continue a script.

Let's say we require `FOO` and `BAR` in our environment before we can continue, we can do this:

```bash
#!/usr/bin/env bash

if [ -z ${FOO} ] || [ -z ${BAR} ] ;
  then 
    echo "required environment variables does not exist"
    exit 1
  else 
    echo "required environment variables are set"
    # do things
    exit 0
fi
```

So now if `FOO` or `BAR` is not set in our environment, the script will exit with return code 1. 

To test it, when we pass no environment variables:

```
$ chmod +x ./update.sh
$ ./update.sh
required environment variables does not exist
```

If we only pass one environment variable:

```
$ FOO=1 ./update.sh
required environment variables does not exist
```

And as the result we want, when we pass both required environment variables, we have success:

```
$ FOO=1 BAR=2 ./update.sh
required environment variables are set
```


