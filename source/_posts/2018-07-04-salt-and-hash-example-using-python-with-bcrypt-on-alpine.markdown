---
layout: post
title: "Salt and Hash Example using Python with Bcrypt on Alpine"
date: 2018-07-04 05:05:00 -0400
comments: true
categories: ["alpine", "bcrypt", "authentication", "encryption", "python", "passwords", "salt", "hashing"] 
---

This is a post on a example of how to hash a password with a salt. A salt in cryptography is a method that applies a one way function to hash data like passwords. The advantage of using salts is to protect your sensitive data against dictionary attacks, etc. Everytime a salt is applied to the same string, the hashed string will provide a different result.

## Installing Bcrypt

I will be using bcrypt to hash my password. I always use alpine images and this is how I got bcrypt running on alpine:

```bash
$ docker run -it apline sh
$ apk add python python-dev py2-pip autoconf automake g++ make --no-cache
$ pip install py-bcrypt
```

This command should produce a `0 exit code`:

```bash
$ python -c 'import bcrypt'; echo $?
``` 

## Bcrypt Example to Hash a Password

Here is a example to show you the output when a salt is applied to a string, such as a password. First we will define our very weak password:

```python
>>> import bcrypt
>>> password = 'pass123'
>>> password
'pass123'
```

The bcrypt package has a function called `gensalt()` that accepts a parameter `log_rounds` which defines the complexity of the hashing. Lets create a hash for our password:

```python
>>> bcrypt.hashpw(password, bcrypt.gensalt(12))
'$2a$12$iquyyyJAlA9nZwlGo0CYK.J37Qn.to/0mTtiCspNAyO8778006XZG'

>>> bcrypt.hashpw(password, bcrypt.gensalt(12))
'$2a$12$UzNjJ1W/cWqBrt5rzNkb..j.gUvrW64DbvVkNbhRDzBtbRvNInaqq'
```

As you can see, the hashed string was different when we called it for the second time.

## Bcrypt Salt Hash and Verification Example:

Thanks to [this](https://stackoverflow.com/questions/9594125/salt-and-hash-a-password-in-python) post, here is a example on how to hash strings and how to verify the plain text password with the provided salt.

Our functions to create the hash and to verify the password:

```python
>>> import bcrypt
>>> def get_hashed_password(plain_text_password):
...     return bcrypt.hashpw(plain_text_password, bcrypt.gensalt())
...
>>>
>>> def check_password(plain_text_password, hashed_password):
...     return bcrypt.checkpw(plain_text_password, hashed_password)
...
>>>
```

Create a hashed string:

```python
>>> print(get_hashed_password('mynewpassword'))
$2a$12$/MemcgbnwJLN8XE86VQZseVxopU6tY76KxnH/AJ0I9T9y1Ldko5gm
```

Verify the hash with your plain text password and the salt that was created:

```python
>>> print(check_password('mynewpassword', '$2a$12$/MemcgbnwJLN8XE86VQZseVxopU6tY76KxnH/AJ0I9T9y1Ldko5gm'))
True
```

When you you provide the wrong password, with the correct salt, the verification will fail:

```python
>>> print(check_password('myOLDpassword', '$2a$12$/MemcgbnwJLN8XE86VQZseVxopU6tY76KxnH/AJ0I9T9y1Ldko5gm'))
False
```

When you provide the correct password with the incorrect salt, the verification will also fail:

```python
>>> print(check_password('mynewpassword', '$2a$12$/MemcgbnwJLN8XE86VQZseVxopU6tY76KxnH/AJ0I9T9y1Ldko5gmX'))
False
```


