---
layout: post
title: "Splitting Characters with Python to determine Name Surname and Email Address"
date: 2017-09-04 09:22:42 -0400
comments: true
categories: ["python"] 
---

I had a bunch of email addresses that was set in a specific format that I can strip characters from, to build up a Username, Name and Surname from the Email Address, that I could use to for dynamic reporting.

## Using Split in Python

Here I will define the value of `emailadress` to a string, then using Python's `split()` function to get the values that I want:

```python
>>> emailaddress = "ruan.bekker@domain.com"
>>> emailaddress.split("@", 1)
['ruan.bekker', 'domain.com']
>>> username = emailaddress.split("@", 1)[0]
>>> username
'ruan.bekker'
>>> username.split(".", 1)
['ruan', 'bekker']
>>> name = username.split(".", 1)[0].capitalize()
>>> surname = username.split(".", 1)[1].capitalize()
>>> name
'Ruan'
>>> surname
'Bekker'
>>> username
'ruan.bekker'
>>> emailaddress
'ruan.bekker@domain.com'
```

## Print The Values in Question:

Now that we have define our keys, let's print the values:

```python
>>> print("Name: {0}, Surname: {1}, UserName: {2}, Email Address: {3}".format(name, surname, username, emailaddress))
Name: Ruan, Surname: Bekker, UserName: ruan.bekker, Email Address: ruan.bekker@domain.com
```

From here on you can build up for example an email function that you can pass the values to your function to get a specific job done.

## Update: Capitalize from One String

Today, I had to capitalize the name and surname that was linked to one variable:

```python
>>> user = 'james.bond'
>>> username = ' '.join(map(str, [x.capitalize() for x in user.split(".")]))
>>> print(username)
James Bond
```
