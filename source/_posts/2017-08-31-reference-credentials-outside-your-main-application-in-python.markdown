---
layout: post
title: "Reference Credentials Outside Your Main Application in Python"
date: 2017-08-31 03:00:58 -0400
comments: true
categories: ["python", "credentials", "security"] 
---

In this post I will show one way of referencing credentials from your application in Python, without setting them in your applications code. We will create a seperate python file which will hold our credentials, and then call them from our main application.

## Our Main Application

This app will print our username, just for the sake of this example:

```python app.py
from config import credentials as secrets

my_username = secrets['APP1']['username']
my_password = secrets['APP1']['password']

print("Hello, your username is: {username}".format(username=my_username))
```

## Our Credentials File

Then we have our file which will hold our credentials:

```python config.py
credentials = {
        'APP1': {
            'username': 'foo',
            'password': 'bar'
            }
        }
```

That is at least one way of doing it, you could also use environment variables using the `os` module, which is described [here](https://stackoverflow.com/a/4907053)

## References:

- https://docs.python.org/2/tutorial/inputoutput.html
- https://docs.python.org/2/library/os.html#os.environ
