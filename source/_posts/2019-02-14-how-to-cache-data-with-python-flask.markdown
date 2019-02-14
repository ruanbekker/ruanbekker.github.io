---
layout: post
title: "How to Cache Data with Python Flask"
date: 2019-02-14 06:37:30 -0500
comments: true
categories: ["python", "flask", "caching"]
---

If you depending on a external source to return static data you can implement `cachetools` to cache data from preventing the overhead to make the request everytime you make a request to Flask.

This is useful when your upstream data does not change often. This is configurable with `maxsize` and `ttl` so whenever the first one's threshold is met, the application will fetch new data whenever the request has been made to your application.

## Example

Let's build a basic flask application that will return the data from our `data.txt` file to the client:

```python
from flask import Flask
from cachetools import cached, TTLCache

app = Flask(__name__)
cache = TTLCache(maxsize=100, ttl=60)

@cached(cache)
def read_data():
    data = open('data.txt', 'r').read()
    return data

@app.route('/')
def main():
    get_data = read_data()
    return get_data

if __name__ == '__main__':
    app.run()
```

Create the local file with some data:

```bash
$ touch data.txt
$ echo "version1" > data.txt
```

Start the server:

```bash
$ python app.py
```

Make the request:

```bash
$ curl http://localhost:5000/
version1
```

Change the data inside the file:

```bash
$ echo "version2" > data.txt
```

Make the request again:

```bash
$ curl http://localhost:5000/
version1
```

As the ttl is set to 60, wait for 60 seconds so that the item kan expire from the cache and try again:

```bash
$ curl http://localhost:5000/
version2
```

As you can see the cache expired and a new request has been made to read the file again and load it in cache, and then return to the client. 
