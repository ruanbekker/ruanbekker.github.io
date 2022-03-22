---
layout: post
title: "Load Environment Variables from File in Python"
date: 2022-03-22 07:34:11 -0400
comments: true
categories: ["python", "config", "environment"]
---

In this quick tutorial we will demonstrate how to load additional environment variables from file into your python application.

It loads key value pairs from a file and append it to its current runtime environment variables, so your current environment is unaffected.

## python-dotenv

We will make use of the package [python-dotenv](https://pypi.org/project/python-dotenv) so we will need to install the python package with pip:

```bash
python3 -m pip install python-dotenv
```

## The env file

I will create the `.env` in my current working directory with the content:

```bash
APPLICATION_NAME=foo
APPLICATION_OWNER=bar
```

## The application

This is a basic demonstration of a python application which loads the additional environment variables from file, then we will use `json.dumps(.., indent=2)` so that we can get a pretty print of all our environment variables:

```python
import os
import json
from dotenv import load_dotenv

load_dotenv('.env')

print(json.dumps(dict(os.environ), indent=2))
```

When we run the application the output will look something like this:

```json
{
  "SHELL": "/bin/bash",
  "PWD": "/home/ubuntu/env-vars",
  "LOGNAME": "ubuntu",
  "HOME": "/home/ubuntu",
  "LANG": "C.UTF-8",
  "TERM": "xterm-256color",
  "USER": "ubuntu",
  "LC_CTYPE": "C.UTF-8",
  "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin",
  "SSH_TTY": "/dev/pts/0",
  "OLDPWD": "/home/ubuntu",
  "APPLICATION_NAME": "foo",
  "APPLICATION_OWNER": "bar"
}
```

As we can see our two environment variables was added to the environment. If you would like to access your two environment variables, we can do the following:

```python
import os
from dotenv import load_dotenv

load_dotenv('.env')

APPLICATION_NAME = os.getenv('APPLICATION_NAME')
APPLICATION_OWNER = os.getenv('APPLICATION_OWNER')

print('Name: {0}, Owner: {1}'.format(APPLICATION_NAME, APPLICATION_OWNER))
```

And when we run that, the output should be the following:

```bash
Name: foo, Owner: bar
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

