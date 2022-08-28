---
layout: post
title: "Linux Shell Commands with the Python Commands Module"
date: 2017-11-06 15:15:23 -0500
comments: true
categories: ["python", "linux", "commands", "shell"] 
---

Using Python to Execute Shell Commands in Linux

## Status Code and Output:

Getting the Status Code and the Output:

```python
>>> import commands
>>> commands.getstatusoutput('echo foo')
(0, 'foo')

>>> status, output = commands.getstatusoutput('echo foo')
>>> print(status)
0
>>> print(output)
foo
```

## Command Output Only:

Only getting the Shell Output:

```python
>>> import commands
>>> commands.getoutput('echo foo')
'foo'
```

## Basic Script

Test file with a one line of data:

```bash
$ cat file.txt 
test-string
```

Our very basic python script:

```python
import commands

status = None
output = None

status, output = commands.getstatusoutput('cat file.txt')
print("Status: {}, Output: {}".format(status, output))
```

Running the script:

```bash
$ python script.py 
Status: 0, Output: test-string
```

