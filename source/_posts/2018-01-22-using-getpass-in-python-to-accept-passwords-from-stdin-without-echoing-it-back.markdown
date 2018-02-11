---
layout: post
title: "Using getpass in Python to accept passwords from stdin without echoing it back"
date: 2018-01-22 13:15:09 -0500
comments: true
categories: ["python", "getpass", "authentication"] 
---

Using `raw_input` in python expects standard input, which echo's it back after enter is executed, below is an example:

```python
>>> word = raw_input("What is the word? \n")
What is the word?
football
>>> print(word)
football
```

Using getpass, the standard input gets masked, like you would expect when entering a password, like below:

```python
>>> from getpass import getpass
>>> word = getpass()
Password:
>>> print(word)
rugby
```

Changing the default prompt:

```python
>>> word = getpass(prompt='What is your name? ')
What is your name?
>>> print(word)
Ruan
```

Creating a Simple Insecure Password Verification App:

```python
from getpass import getpass

password = getpass()
if password.lower() == 'simplepass':
    print 'Password Correct'
else:
    print 'Password Failed'
```

Testing it, by first entering a incorrect string, then the correct one:

```bash
$ python auth-check.py
Password:
Password Failed

$ python auth-check.py
Password:
Password Correct
```

You definitely don't want to hard code the credentials in your app, but you get the idea.
