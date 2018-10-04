---
layout: post
title: "Splitting Query String Parameters from a URL in Python"
date: 2018-10-04 09:58:46 -0400
comments: true
categories: ["python", "urllib", "analysis"] 
---

I'm working on capturing some data that I want to use for analytics, and a big part of that is capturing the query string parameters that is in the request URL.

So essentially I would like to break the data up into key value pairs, using Python and the urllib module, which will then pushed into a database like MongoDB or DynamoDB.

## Our URL:

So the URL's that we will have, will more or less look like the following:

```bash
https://surveys.mydomain.com/one/abc123?companyId=178231&group_name=abc_12&utm_source=survey&utm_medium=email&utm_campaign=survey-top-1
```

So we have a couple of utm parameters, company id, group name etc, which will be use for analysis

## Python to Capture the Parameters:

Using Python, it's quite easy:

```python
>>> from urllib import parse
>>> url = 'https://surveys.mydomain.com/one/abc123?companyId=178231&group_name=abc_12&utm_source=survey&utm_medium=email&utm_campaign=survey-top-1'

>>> parse.urlsplit(url)
SplitResult(scheme='https', netloc='surveys.mydomain.com', path='/one/abc123', query='companyId=178231&group_name=abc_12&utm_source=survey&utm_medium=email&utm_campaign=survey-top-1', fragment='')
>>> parse.parse_qsl(parse.urlsplit(url).query)
[('companyId', '178231'), ('group_name', 'abc_12'), ('utm_source', 'survey'), ('utm_medium', 'email'), ('utm_campaign', 'survey-top-1')]
```

Now to get our data in a dictionary, we can just convert it using the `dict()` function:

```python
>>> dict(parse.parse_qsl(parse.urlsplit(url).query))
{'companyId': '178231', 'group_name': 'abc_12', 'utm_source': 'survey', 'utm_medium': 'email', 'utm_campaign': 'survey-top-1'}
```

This data can then be used to write to a database, which can then be used for analysis.

## Resources:

- http://blog.rafflecopter.com/2014/04/utm-parameters-best-practices/
- https://stackoverflow.com/questions/21584545/url-query-parameters-to-dict-python
