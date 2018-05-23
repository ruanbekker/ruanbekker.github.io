---
layout: post
title: "Generate Random Characters with Python using Random and String Modules"
date: 2018-05-23 06:29:06 -0400
comments: true
categories: ["python", "random", "scripting"]
---

When generating random characters for whatever reason, passwords, secrets-keys etc, you could use the `uuid` module, which looks like this:

```python Random String with UUID
>>> from uuid import uuid4
>>> print("Your string is: {0}".format(uuid4()) )
Your string is: 53a6e1a7-a2c7-488e-bed9-d76662de9c5f
```

But if you want to be more specific, like digits, letters, capitalization etc, you can use the `string` and `random` modules to do so. First we will generate a random string containing only letters:

```python Random String with letters
>>> from string import ascii_letters, punctuation, digits
>>> from random import choice, randint
>>> min = 12
>>> max = 15
>>> string_format = ascii_letters
>>> generated_string = "".join(choice(string_format) for x in range(randint(min, max)))

>>> print("Your String is: {0}".format(generated_string))
Your String is: zNeUFluvZwED
```

As you can see, you have a randomized string which will be always at least 12 characters and max 15 characters, which is lower and upper case. You can also use the `lower` and `upper` functions if you want to capitalize or lower case your string:

```python
>>> generated_string.lower()
'zneufluvzwed'

>>> generated_string.upper()
'ZNEUFLUVZWED'
```

Let's add some logic so that we can have a more randomized characters with digits, punctuations etc:

```python Random String with Letters, Punctuations and Digits
>>> from string import ascii_letters, punctuation, digits
>>> from random import choice, randint
>>> min = 12
>>> max = 15
>>> string_format = ascii_letters + punctuation + digits
>>> generated_string = "".join(choice(string_format) for x in range(randint(min, max)))
>>> print("Your String is: {0}".format(generated_string))
Your String is: Bu>}x_/-H5)fLAr
```

More [Python](https://goo.gl/G9VRpe) related blog posts.

<center>
  <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script>
  <script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
