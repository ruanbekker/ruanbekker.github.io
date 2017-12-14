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
    app.run(host='0.0.0.0', port=80)
```

## Populating the HTML Static Content:

As we are using `render_template` we need to populate our html files in our `templates/` directory. As you can see we have 3 different html files:

- `templates/bar_chart.html` :

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{{ title }}</title>
  <script src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min.js'></script>
</head>

<body>
  <center>
    <h1>{{ title }}</h1>
  </center>
  <center>
    <canvas id="chart" width="600" height="400"></canvas>
    <script>
      // bar chart data
      var barData = {
        labels : [
          {% for item in labels %}
            {{ item }}
          {% endfor %}
	],

        datasets : [{
          fillColor: "rgba(151,187,205,0.2)",
          strokeColor: "rgba(151,187,205,1)",
          pointColor: "rgba(151,187,205,1)",
          data : [
            {% for item in values %}
               {{item}}
              {% endfor %}
	    ]
          }
        ]
      }

     // get bar chart canvas
     var mychart = document.getElementById("chart").getContext("2d");

       steps = 10
       max = {{max}}

     // draw bar chart
     new Chart(mychart).Bar(barData, {
       scaleOverride: true,
       scaleSteps: steps,
       scaleStepWidth: Math.ceil(max / steps),
       scaleStartValue: 0,
       scaleShowVerticalLines: true,
       scaleShowGridLines : true,
       barShowStroke : true,
       scaleShowLabels: true
       }
     );

    </script>
  </center>
</body>
</html>
```

- `templates/line_chart.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{{ title }}</title>
  <script src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min.js'></script>
</head>

<body>
  <center>
    <h1>{{ title }}</h1>

    <canvas id="chart" width="600" height="400"></canvas>
    <script>

      // bar chart data
      var barData = {
        labels : [
          {% for item in labels %}
            "{{item}}",
          {% endfor %}
        ],

        datasets : [{
          fillColor: "rgba(151,187,205,0.2)",
          strokeColor: "rgba(151,187,205,1)",
          pointColor: "rgba(151,187,205,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(151,187,205,1)",
          bezierCurve : false,
          data : [
	    {% for item in values %}
              {{item}},
            {% endfor %}]
          }
	]
      }

      Chart.defaults.global.animationSteps = 50;
      Chart.defaults.global.tooltipYPadding = 16;
      Chart.defaults.global.tooltipCornerRadius = 0;
      Chart.defaults.global.tooltipTitleFontStyle = "normal";
      Chart.defaults.global.tooltipFillColor = "rgba(0,0,0,0.8)";
      Chart.defaults.global.animationEasing = "easeOutBounce";
      Chart.defaults.global.responsive = false;
      Chart.defaults.global.scaleLineColor = "black";
      Chart.defaults.global.scaleFontSize = 16;

      // get bar chart canvas
      var mychart = document.getElementById("chart").getContext("2d");

      steps = 10
      max = {{ max }}
      // draw bar chart
      var LineChartDemo = new Chart(mychart).Line(barData, {
        scaleOverride: true,
        scaleSteps: steps,
        scaleStepWidth: Math.ceil(max / steps),
        scaleStartValue: 0,
        scaleShowVerticalLines: true,
        scaleShowGridLines : true,
        barShowStroke : true,
        scaleShowLabels: true,
        bezierCurve: false,
      });

    </script>
  </center>
</body>
</html>
```

- `templates/pie_chart.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{{ title }}</title>
  <script src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min.js'></script>
</head>

<body>
    <h1>{{ title }}</h1>

    <canvas id="chart" width="600" height="400"></canvas>
    <script>
      var pieData = [
        {% for item, label, colors in set %}
          {
            value: {{item}},
            label: "{{label}}",
            color : "{{colors}}"
          },
        {% endfor %}
      ];

      // get bar chart canvas
      var mychart = document.getElementById("chart").getContext("2d");
      steps = 10
      max = {{ max }}

      // draw pie chart
      new Chart(document.getElementById("chart").getContext("2d")).Pie(pieData);

    </script>
</body>
</html>
```

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
