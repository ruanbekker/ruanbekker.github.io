---
layout: post
title: "Web Forms with Python Flask and the WTForms Module with Bootstrap"
date: 2018-05-27 17:44:41 -0400
comments: true
categories: ["python", "flask", "forms", "wtforms", "bootstrap"] 
---

![](http://obj-cache.cloud.ruanbekker.com/flask.png)

Quick demo with Web Forms using the WTForms module in Python Flask.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Requirements:

Install the required dependencies:

```bash
$ pip install flask wtforms
```

## Application:

The Application code of the Web Forms Application. Note that we are also using validation, as we want the user to complete all the fields. I am also including a function that logs to the directory where the application is running, for previewing the data that was logged.

```python app.py
from random import randint
from time import strftime
from flask import Flask, render_template, flash, request
from wtforms import Form, TextField, TextAreaField, validators, StringField, SubmitField

DEBUG = True
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = 'SjdnUends821Jsdlkvxh391ksdODnejdDw'

class ReusableForm(Form):
    name = TextField('Name:', validators=[validators.required()])
    surname = TextField('Surname:', validators=[validators.required()])

def get_time():
    time = strftime("%Y-%m-%dT%H:%M")
    return time

def write_to_disk(name, surname, email):
    data = open('file.log', 'a')
    timestamp = get_time()
    data.write('DateStamp={}, Name={}, Surname={}, Email={} \n'.format(timestamp, name, surname, email))
    data.close()

@app.route("/", methods=['GET', 'POST'])
def hello():
    form = ReusableForm(request.form)

    #print(form.errors)
    if request.method == 'POST':
        name=request.form['name']
        surname=request.form['surname']
	email=request.form['email']
	password=request.form['password']

        if form.validate():
            write_to_disk(name, surname, email)
            flash('Hello: {} {}'.format(name, surname))

        else:
            flash('Error: All Fields are Required')

    return render_template('index.html', form=form)

if __name__ == "__main__":
    app.run()
```

## HTML Template:

`templates/index.html`

<script src="https://gist.github.com/ruanbekker/f552f1e57aeb038e8c10b148ed1e4c2b.js"></script>

This will result in a basic web form like this:

![](https://i.snag.gy/3x98UV.jpg)

## Resources:

- https://getbootstrap.com/docs/4.1/components/alerts/
- https://pythonspot.com/en/download-flask-examples/
- https://flask-wtf.readthedocs.io/en/stable/quickstart.html
- https://pythonspot.com/flask-web-forms/

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
