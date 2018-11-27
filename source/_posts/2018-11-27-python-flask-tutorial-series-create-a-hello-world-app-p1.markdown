---
layout: post
title: "Python Flask Tutorial Series: Create a Hello World App"
date: 2018-11-27 08:36:20 -0500
comments: true
categories: ["python", "flask", "flask-tutorial", "web-development"]
---

![](https://objects.ruanbekker.com/assets/images/python-flask.png)

This is post 1 of the [Python Flask Tutorial Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/)

## What is Python Flask

Flask is a Micro Web Framework which is written in Python and is based on the Werkzeug Toolkit and the Jinja2 Template Engine.

Flask is super lightweight, and you import the modules as you need them, from some research some say that Flask is more designed for smaller applications whereas Django is designed for your larger applications.

a Good read on the [Differences and Performance Comparison]. With that being said, if you are planning with scale I am pretty sure that Flask can handle big applications, but it probably depends what your application is doing. More [Detailed Discussion](https://www.reddit.com/r/Python/comments/2jja20/is_flask_good_enough_to_develop_large_applications/) on Reddit.

## Hello World in Python Flask

In this post we will be creating a "Hello, World" application to demonstrate how easy it is to run a Flask Appliation.

The only requirement you need to run this app, would be to to have `python` and `pip` installed so that we can install the `Flask` package which is needed.

## Creating your Traditional Hello World App

We will install flask globally, but will write up a [future post](https://sysadmins.co.za/python-flask-series-environment-setup-p3/) on how to setup a virtual environment for you application. Install the flask package:

```bash
$ pip install flask
```

The code for the Hello World Flask Application:

```python
from flask import Flask 

app = Flask(__name__)

@app.route('/')
def index():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
```

Save the above code as `app.py` and then run the application as follows:

```
$ python app.py
 * Debug mode: on
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 282-492-812
```

## It's Running What Now?

We can see that our application is running on 127.0.0.1 and listening on port: 5000, if you point your browser to this URL, you will be returned with: Hello, World!

```bash
$ curl -i -XGET http://127.0.0.1:5000/
HTTP/1.0 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 13
Server: Werkzeug/0.12.1 Python/2.7.12
Date: Thu, 27 Nov 2018 13:51:15 GMT

Hello, World!
```

## Explaining the Application Code

- First, we imported the `Flask` class from the flask module, using: `from flask import Flask`
- Then we instantiate our application from the Flask class: `app = Flask(__name__)` using our module's name as a parameter, where our app object will use this to resolve resources. We are using `__name__` , which links our module to our app object.
- Next up we have the `@app.route('/')` decorator. Flask uses decorators for URL Routing.
- Below our decorator, we have a `view function`, this function will be executed when the `/` route gets matched, in this case returning `Hello, World!`
- The last line starts our server, and from this example it runs locally on `127.0.0.1` on port: `5000` and `debug is enabled`, so any error details will be logged directly in the browser. This is only recommended for test/dev and not for production as you can make your service vulnerable for hackers.

## Let's Extend our Hello World App

We would like to add the route '/movie' which will return a random movie name:

```python
import random
from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return 'Hello, World!'

@app.route('/movie')
def movie():
    movies = ['godfather', 'deadpool', 'toy story', 'top gun', 'forrest gump']
    return random.choice(movies)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
```

Making a GET Request on the '/movie' route:

```bash
$ curl -XGET http://127.0.0.1/movie
forrest gump
```

This was just a basic example and will be covering more topics in detail at a further stage.

Next up, setting up our Python Environment, with Virtual Environment (virtualenv)

## Related Content

All posts related to this tutorial series will be listed under [Python Flask Tutorial Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/) tag.

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>
