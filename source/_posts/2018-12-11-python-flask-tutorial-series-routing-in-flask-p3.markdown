---
layout: post
title: "Python Flask Tutorial Series: Routing in Flask"
date: 2018-12-11 05:29:14 -0500
comments: true
categories: ["python", "flask", "flask-tutorial", "web-development"] 
---

![](https://objects.ruanbekker.com/assets/images/python-flask.png)

This is post 3 of our [Python Flask Tutorial Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/) where we will go into Views and Routing.

In our previous post we went through the steps to setup a [Virtual Environment for our Flask App](https://blog.ruanbekker.com/blog/2018/12/09/python-flask-tutorial-series-setup-a-python-virtual-environment-p2/)

## Flask Views and Routing:

Flask Routing is essentially mapping a URL eg. `example.com/pages/test` to a view function within your code. For example having `/contact-us` displaying a page about contact details.

The `route()` decorator in Flask is used to bind the URL to a function.

## Some basic examples:

This is a basic web app that shows on which page you are:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/home')
def home():
    return '<h2>You are on the Home Page</h2>

@app.route('/about-us')
def about():
    return '<h2>You are on the About Us Page</h2>'

if __main__ == '__name__':
    app.run()
```

With `app.run()` we have passed no arguments, so it will use the defaults, which is:

- Host: `127.0.0.1`
- Port: `5000`
- Debug: `False`

To set your own values, you could do something like: `app.run(host='0.0.0.0', port=8080, debug=True)`. Note: Never use debug mode in production.

So when you do a GET Request on `http://localhost:5000/home` you will be presented with the response that you are on the home page.

This is all good and well, but its static, so lets look how we can set this up in a dynamic way.

## URL Variables:

We can use variables in the `route()` decorator which we can parse through to the function. In this next example we will use a `name` variable, and depending on what name is passed in the GET request, will be provided in the response.

```python
from flask import Flask
app = Flask(__name__)

@app.route('/user/<name>')
def user(name):
    return 'Welcome, {}'.format(name)

if __main__ == '__name__':
    app.run()
```

So with the above example, `<name>` will be used as a placeholder or variable, and then passed through to our function and then returned in our response, for example:

```bash
$ curl -XGET http://localhost:5000/user/James
Welcome, James

$ curl -XGET http://localhost:5000/user/Frank
Welcome, Frank
```

So this can be really useful when dealing with dynamic data. You can also go deeper into this, like the following:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/user/<name>/<surname>/<prog_lang>')
def user(name, surname, prog_lang):
    return '{} {} likes {}'.format(name, surname, prog_lang)

if __main__ == '__name__':
    app.run()
```

This will produce:

```bash
$ curl -XGET http://localhost:5000/user/John/Smith/Python
John Smith likes Python
```

We can also have defaults, so if no values was passed, and you only hit the `/user` endpoint, you can have a default value returned:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/user', defaults={'name': 'Ruan', 'surname': 'B', 'prog_lang': 'Python'})
@app.route('/user/<name>/<surname>/<prog_lang>')
def user(name, surname, prog_lang):
    return '{} {} likes {}'.format(name, surname, prog_lang)

if __main__ == '__name__':
    app.run()
```

So then the output would look like this:

```bash
$ curl -XGET http://localhost:5000/user
Ruan B likes Python
```

This is a very simple example, but you could use it in many ways.

## Data Types in URL Routing:

You could also explicitly set your datatypes, like string or integer etc in your route decorators.

Example for *Strings*:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/city/<string:cityname>')
def user(cityname):
    return 'Selected City is: {}'.format(cityname)

if __main__ == '__name__':
    app.run()
```

Example for *Integers*:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/user/<integer:age>')
def user(age):
    return 'Selected age is: {}'.format(age)

if __main__ == '__name__':
    app.run()
```

And now because the datatype is an integer, when you try to pass a string, you will be faced with an error. So the value that you will need to pass would then be strictly set to the type of integer.

Example with *if statements*:

You could also use if statements in your functions, like determining the age group, for example:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/user/<integer:age>')
def user(age):
    if age >= 28:
        return 'Your selected age is {}, so you are in the 28 and older group'.format(age)
    else:
        return 'Your selected age is {}, so you are in the younger then 28 group'.format(age)

if __main__ == '__name__':
    app.run()
```

So with the above example:

```bash
$ curl -XGET http://127.0.0.1:5000/user/12
Your selected age is 12, so you are in the younger then 28 group

$ curl -XGET http://127.0.0.1:5000/user/30
Your selected age is 30, so you are in the 28 and older group
```

Example with *Floats*:

```
@app.route('/myfloat/<float:floatnum>')
```

Example with *Path Types*:

We can also pass accept the URL Path, that is passed by using the path type:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/path/<path:mypath>')
def user(mypath):
    return 'Your selected path is: /{}'.format(mypath)

if __main__ == '__name__':
    app.run()
```

So with the above example:

```bash
$ curl -XGET http://127.0.0.1:5000/path/apps/data/my/app
Your selected path is: /apps/data/my/app
```

I hope this was useful, next up in our [Python Flask Tutorial-Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/) will be rendering templates in flask with the jinja2 templating engine.

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
