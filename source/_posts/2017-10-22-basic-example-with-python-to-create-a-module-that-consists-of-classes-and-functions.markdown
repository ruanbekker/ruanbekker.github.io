---
layout: post
title: "Basic Example with Python to create a Module that consists of Classes and Functions"
date: 2017-10-22 05:45:17 -0400
comments: true
categories: ["python", "learning-python", "functions", "classes"] 
---

Just a very basic example how to create a Python Module that consists of a Single Class and 2 basic functions. 

Our main app will can our module to print out a word, that we pass to our first function.

## The Directory Setup:

Below is a tree view of my current working directory:

```bash
$ tree
.
├── providers
│   ├── __init__.py
│   ├── test.py
├── README.md
└── main.py
```

In order to make a python file a module, we need to have a blank `__init__.py` file in our directory. So any files under our providers directory will be seen as modules from our `main.py` file.

## Our Test Module:

in our `providers/test.py` file:

```python
class TestClass:
    
    def word_to_return(self, word_value):
        return word_value
   
    def simple_test(self):
        data = self.word_to_return('its me!')
        return data
```

Then our `providers/test.py` file will be blank.

Our `main.py`, we will import our test module, instantiate our class, and call our function within the class that we instantiated:

```python
from providers import test

test_instance = test.TestClass()
response = test_instance.simple_test()

print(response)
```

instead of `response = test_instance.simple_test()`, you could also do `print(test_instance.simple_test()`

## Testing it out:

```bash
$ python main.py
its me!
```

It's very basic but will post some more topics around this in the future.

Also note, this blog is for quick posts that I come accross during my daily doings, for more details tutorials have a look at my main blog: [sysadmins.co.za](https://sysadmins.co.za/?referral=blog.ruanbekker.com?category=python)
