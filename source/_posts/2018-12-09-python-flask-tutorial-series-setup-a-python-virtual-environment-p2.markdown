---
layout: post
title: "Python Flask Tutorial Series: Setup a Python Virtual Environment"
date: 2018-12-09 17:19:24 -0500
comments: true
categories: ["python", "flask", "flask-tutorial", "web-development"] 
---

![](https://objects.ruanbekker.com/assets/images/python-flask.png)

In our previous post we wrote a basic [Hello World App in Flask](https://blog.ruanbekker.com/blog/2018/11/27/python-flask-tutorial-series-create-a-hello-world-app-p1/). This is post 2 of the [Python Flask Tutorial Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/)

In this section we will be covering our Environment Setup, where I will be showing you how to setup a typical Python Flask Environment using [virtualenv](http://virtualenv.readthedocs.org/en/latest/)

## What is VirtualEnv?

Virtualenv allows you to have isolated Python Environments, where each project or environment can have their own versions. Some applications may need a specific version of a certain package, so lets say you are running multiple applications on one server, then having to manage each ones dependencies can be a pain. As you may run into scenarios where they are dependent on specific versions, where you have to upgrade/downgrade packages like no-ones business.

Luckily with the help of virtualenv, each environment is isolated from each other, so system wide you might be running Python 2.7 with minimal packages installed, then you can create a virtual environment with Python 3 with packages for the application you are developing.

## Setup a Virtual Environment:

We will setup a virtualenv for our project with our default python version which in this case is 2.7:

```
$ mkdir ~/projects/mywebapp
$ cd ~/projects/mywebapp
$ virtualenv .venv
```

At this moment you should have your virtual environment ready, now to enter and activate our environment:

```
$ source .venv/bin/activate
```

To confirm your python version:

```
$ python --version
Python 2.7.6
```

If you have multiple versions of python, you can create your virtual environment with a different python version by using the `-p` flag, as in:

```
$ virtualenv -p /usr/local/bin/python2.7 .venv
```

Now that we are in our virtualenv, lets install 2 packages, Flask and Requests:

```
$ pip install flask
$ pip install requests
```

With pip we can list the installed packages we have with `pip freeze`. Since this is our virtual environment, we will only see the packages that was installed into this environment:

```
$ pip freeze
click==6.7
Flask==0.12
itsdangerous==0.24
Jinja2==2.9.5.1
MarkupSafe==1.0
requests==2.7.0
six==1.10.0
virtualenv==15.0.1
Werkzeug==0.12.1
```

We can dump this to a file, which we can later use to install packages from a list so that we don't have to specify them manually. We can dump them by doing this:

```bash
$ pip freeze > requirements.txt
```

Now lets say you are on a different host and you would like to install the packages from the `requirements.txt` file, we do this by using the following command:

```bash
$ pip install -r requirements.txt
```

To exit your virtualenv, you do the following:

```bash
$ deactivate
```

I hope this was useful, next up in our [Python Flask Tutorial Series](http://blog.ruanbekker.com/blog/categories/flask-tutorial/) will be [Routing in Flask](https://blog.ruanbekker.com/blog/2018/12/11/python-flask-tutorial-series-routing-in-flask-p3/)

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

