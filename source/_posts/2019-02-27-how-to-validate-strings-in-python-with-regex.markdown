---
layout: post
title: "How to Validate Strings in Python with Regex"
date: 2019-02-27 06:47:53 -0500
comments: true
categories: ["python", "regex", "validation", "scripting"] 
---

Let's say you need to validate strings in Python. Making decisions if a string is valid or not, is what we will be looking at today.

<script src="//ap.lijit.com/www/delivery/fp?z=601358"></script> 

## The Scenario

We have a string that will look like this: `my-random-abc-string-2947104284738593726152637836291`. The `abc` section will always be 3 random string characters and the integers, will always be 32 integer characters, the rest will always stay the same.

Using the `re` library, we will create our regex expression and match them up with a input string, then if they are the same, we will pass the validation check, and make a decision from there.

## The Script

Our random string generator:

```python
>>> import uuid
>>> import random
>>> letters = 'abcdefghijklmnopqrstuvwxyz'
>>> def generate_string():
...     random_letters = ''.join(random.choice(letters) for x in range(3))
...     response = 'my-random-' + random_letters + '-string_' + uuid.uuid4().hex
...     return response
```

Our validation check:

```python
>>> import re
>>> def validation_check(input_string):
...     regex = re.compile('my-random-[a-z]{3}-string_[0-9a-z]{32}\Z', re.I)
...     match = regex.match(str(input_string))
...     return bool(match)
```

Doing the validation check against our data:

```python
>>> mystring = generate_string()
>>> mystring
'my-random-ngt-string_6346145281738193742120539836241'

>>> validate = validation_check(mystring)
>>> if validate == True:
...     print('The string {} is valid'.format(mystring))
... else:
...     print('The string {} is not valid'.format(mystring))

the string my-random-ngt-string_6346145281738193742120539836241 is valid
```

The function checks for a strict 32 characters in the random hex number, if you had to randomize the length, you can always use this regex:

```python
regex = re.compile('my-random-[a-z]{3}-string__[0-9]+', re.I)
```


