---
layout: post
title: "Graphing Pretty Charts with Python Flask and Chartjs"
date: 2017-12-14 02:28:51 -0500
comments: true
categories: ["python", "flask", "charts", "graphs", "chartjs"] 
---

I am a big sucker for Charts and Graphs, and today I found one awesome library called [Chart.js](http://www.chartjs.org/), which we will use with Python Flask Web Framework, to graph our data.

As Bitcoin is doing so well, I decided to graph the monthly Bitcoin price from January up until now.

## Dependencies:

Install Flask:

```bash
$ pip install flask
```

Create the files and directories:

```bash
$ touch app.py
$ mkdir templates
```

We need the [Chart.js](http://www.chartjs.org/docs/latest/#installation) library, but I will use the CDN version, in my html.

## Creating the Flask App:

Our data that we want to graph will be hard-coded in our application, but there are many ways to make this more dynamic, in your `app.py`:

```python
from flask import Flask, Markup, render_template

app = Flask(__name__)

labels = [
    'JAN', 'FEB', 'MAR', 'APR',
    'MAY', 'JUN', 'JUL', 'AUG',
    'SEP', 'OCT', 'NOV', 'DEC'
]

values = [
    967.67, 1190.89, 1079.75, 1349.19,
    2328.91, 2504.28, 2873.83, 4764.87,
    4349.29, 6458.30, 9907, 16297
]

colors = [
    "#F7464A", "#46BFBD", "#FDB45C", "#FEDCBA",
    "#ABCDEF", "#DDDDDD", "#ABCABC", "#4169E1",
    "#C71585", "#FF4500", "#FEDCBA", "#46BFBD"]

@app.route('/bar')
def bar():
    bar_labels=labels
    bar_values=values
    return render_template('bar_chart.html', title='Bitcoin Monthly Price in USD', max=17000, labels=bar_labels, values=bar_values)

@app.route('/line')
def line():
    line_labels=labels
    line_values=values
    return render_template('line_chart.html', title='Bitcoin Monthly Price in USD', max=17000, labels=line_labels, values=line_values)

@app.route('/pie')
def pie():
    pie_labels = labels
    pie_values = values
    return render_template('pie_chart.html', title='Bitcoin Monthly Price in USD', max=17000, set=zip(values, labels, colors))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

## Populating the HTML Static Content:

As we are using `render_template` we need to populate our html files in our `templates/` directory. As you can see we have 3 different html files:

- `templates/bar_chart.html` :

<script src="https://gist.github.com/ruanbekker/019a893face148a43b048240a79c4605.js"></script>

- `templates/line_chart.html`:

<script src="https://gist.github.com/ruanbekker/b9fe6d95019a0e382108f7bfe3ed4122.js"></script>

- `templates/pie_chart.html`:

<script src="https://gist.github.com/ruanbekker/540737448cd8d4a1b427028fa713b061.js"></script>

## Running our Application:

As you can see, we have 3 endpoints, each representing a different chart style:

- /line
- /bar
- /pie

Let's start our flask application:

```bash
$ python app.py
```

When we access our `/line` endpoint:

![](https://i.snag.gy/M8FU6S.jpg)

When we access our `/bar` endpoint:

![](https://i.snag.gy/DTp0AZ.jpg)

When we access our `/pie` endpoint:

![](https://i.snag.gy/D6nqJN.jpg?nocache=1513261344206)

## Resources:

- https://pythonspot.com/flask-and-great-looking-charts-using-chart-js/
- http://www.chartjs.org/docs/latest/#installation
