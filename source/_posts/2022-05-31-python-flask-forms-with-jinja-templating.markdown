---
layout: post
title: "Python Flask Forms with Jinja Templating"
date: 2022-05-31 02:39:30 -0400
comments: true
categories: ["python", "flask", "programming"]
---

![ruanbekker-blog](https://user-images.githubusercontent.com/567298/171112630-7fd74a3a-d216-4b4c-85a2-8d9de6428f45.png)

In this tutorial, we will demonstrate how to use [Python Flask](https://flask.palletsprojects.com/en/2.1.x/) and `render_template` to use [Jinja Templating](https://jinja.palletsprojects.com/en/3.1.x/) with our Form. The example is just a ui that accepts a firstname, lastname and email address and when we submit the form data, it renders on a table.

## Install Flask

Create a virtual environment and install python flask

```bash
python3 -m pip install virtualenv
python3 -m virtualenv -p python3 .venv
source .venv/bin/activate
```

## The Code

First we will create our application code in `app.py`:

```python
from flask import Flask, render_template, request

app_version = '1.1.0'

app = Flask(__name__)

@app.route('/')
def root():
    return render_template('form.html')

@app.route('/result',methods = ['POST', 'GET'])
def result():
    if request.method == 'POST':
        result = request.form
        json_result = dict(result)
        print(json_result)
        return render_template("result.html", result=result, app_version=app_version)

if __name__ == '__main__':
    app.run(debug = True)
```

As you can see our first route `/` will render the template in `form.html`. Our second route `/result` a couple of things are happening:
- If we received a POST method, we will capture the form data
- We are then casting it to a dictionary data type
- Print the results out of our form data (for debugging)
- Then we are passing the result object and the app_version variable to our template where it will be parsed.

When using `render_template` all html files resides under the `templates` directory, so let's first create our `base.html` file that we will use as a starting point in `templates/base.html`:

```
mkdir templates
```

Then in your `templates/base.html`:

<script src="https://gist.github.com/ruanbekker/4d6b3e91b629795b3429a15f5db72972.js"></script>

In our `templates/form.html` we have our form template, and you can see we are referencing our `base.html` in our template to include the first bit:

<script src="https://gist.github.com/ruanbekker/f9e0c78d12987e19862486e446378ed7.js"></script>

Then our last template `templates/result.html` is used when we click on submit, when the form data is displayed in our table:

<script src="https://gist.github.com/ruanbekker/ad40ae4c59a81e8c089e7df2d50c605a.js"></script>

So our directory structure should look like this:

```bash
├── app.py
└── templates
    ├── base.html
    ├── form.html
    └── result.html

1 directory, 4 files
```

Then run the server:

```
python app.py
```

## Screenshots

It should look like the following when you access http://localhost:5000/

![python-flask-forms](https://user-images.githubusercontent.com/567298/171111587-915935a6-1557-4039-bbd0-d1d95070c2ae.png)

After entering your form data, select "Submit", then you should see the following:

![python-flask-forms](https://user-images.githubusercontent.com/567298/171111868-9f8974d2-90cc-45c9-b930-da2d6ec96cbf.png)

So you can see that our request data was parsed through the template and our app version variable as well.

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.


