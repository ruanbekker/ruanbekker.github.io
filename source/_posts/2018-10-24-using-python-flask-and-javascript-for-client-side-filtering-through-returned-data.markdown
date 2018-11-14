---
layout: post
title: "Using Python Flask and JavaScript for Client Side Filtering through Returned Data"
date: 2018-10-24 05:39:33 -0400
comments: true
categories: ["python", "flask", "javascript", "docker", "web-development"] 
---

![](https://objects.ruanbekker.com/assets/images/python-logo.png)

This post will cover 2 sections, using Python Flask and Javascript to filter returned data, where you could have a table that represents 100 items, and you want to have a search box to filter down your results as you type.

The other section will be used as a demo, with solving a problem with Amazon CloudWatch Logs. I'm a Massive AWS Fanatic, but when it comes to CloudWatch Logs, I'm not so big of a fan of that specific service. Especially when you use Docker Swarm for AWS and have your logdriver set to CloudWatch Logs.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## The Problem I have with CloudWatch Logs

When you point to your CloudWatch LogGroups, you can search for your streams, and in my case searching for a specific swarm service, but you can't sort by date, like this:

![](https://objects.ruanbekker.com/assets/images/cloudwatch-logs-date-issue.png)

This makes it really tedious when trying to search find your logs in a quick way.

## Python Flask to the Resque

We will create a Python Flask application that retrieves your data about all your Docker Swarm Services and Container Id's running on each node. For this demonstration, I have hard coded the services and container id's, but using it in a real environment, you can utilise the Docker API or some logic that retrieves it from a datastore where a process populates it to.

The Application Code will do the following:

- returns a list of your swarm services (mock data in the code)
- when you select a service, it will get a list of the container ids and run through a for loop unsing jinja templates and display them in table format
- when you select the containerId, it will populate the containerId to the cloudwatch logs filter, giving you the exact logstream which you are looking for
- this will do a redirect to the AWS Console, and you will see the data in the sorted time of interest

- `app.py`

```python
from flask import Flask, render_template

app = Flask(__name__)

# faking datasets that can be returned from a api or database
swarm_services = ['my-web-service', 'my-api-service']
swarm_tasks = {
    "my-web-service": {
        "container_names": [
            "my-web-service.1.alfjshoehfosfn",
            "my-web-service.2.fuebchduehakjdu"
        ]
    },
    "my-api-service": {
        "container_names": [
            "my-api-service.1.oprudhyuythvbzx",
            "my-api-service.2.sjduebansifotuf"
        ]
    }
}

def get_container_name(app_name):
    data = []
    response = swarm_tasks[app_name]
    for container in response['container_names']:
        data.append(container)
    return render_template('index.html', app_name=app_name, number=len(data), data=data)

@app.route('/')
def list():
    return render_template('list.html', number=len(swarm_services), apps=swarm_services, aws_region='eu-west-1', cloudwatch_log_stream='docker-swarm-lg')

@app.route('/describe/<string:app_name>')
def get_app(app_name):
    app = get_container_name(app_name)
    return app

if __name__ == '__main__':
    app.run()
```

The `index.html`: 

<script src="https://gist.github.com/ruanbekker/08b02a3ef30367ea7306a31eb5f33cb1.js"></script>

The `list.html` :

<script src="https://gist.github.com/ruanbekker/98eab090e218bbbf0e46d5efc1595e04.js"></script>

## Filtering the Data

So at this moment all your data will be returned when a list is done, if you are in a case where you have lots of information, it can be overwelming and you will need to search for the service of interest. Using HTML and JavaScript, you can filter through the results:

The JavaScript Function: `assets/js/filter.js`

```javascript
function SearchAndFilterThingy() {
  var input, filter, table, tr, td, x;
  input = document.getElementById("UserInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("ServicesTable");
  tr = table.getElementsByTagName("tr");

  for (x = 0; x < tr.length; x++) {
    td = tr[x].getElementsByTagName("td")[0];
    if (td) {
      if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
        tr[x].style.display = "";
      }
      else {
        tr[x].style.display = "none";
      }
    }
  }
}
```

## Screenshot

Once you search for a specific keyword on the service you are looking for the output should more or less look like the following:

![](https://objects.ruanbekker.com/assets/images/docker-flask-running-services.png)
