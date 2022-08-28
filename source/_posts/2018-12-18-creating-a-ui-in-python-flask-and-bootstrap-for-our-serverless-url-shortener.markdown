---
layout: post
title: "Creating a UI in Python Flask and Bootstrap for our Serverless URL Shortener"
date: 2018-12-18 09:35:53 -0500
comments: true
categories: ["python", "flask", "bootstrap", "web-development"]
---

![](https://objects.ruanbekker.com/assets/images/python-flask.png)

From a [previous](https://blog.ruanbekker.com/blog/2018/11/30/how-to-setup-a-serverless-url-shortener-with-api-gateway-lambda-and-dynamodb-on-aws/) post, we went through the setup of building a [Serverless URL Shortener with API Gateway, Lambda, and DynamoDB on AWS](https://blog.ruanbekker.com/blog/2018/11/30/how-to-setup-a-serverless-url-shortener-with-api-gateway-lambda-and-dynamodb-on-aws/). Today we will build a Web User Interface using Python Flask, Bootstrap and JavaScript that will communicate to our API to shorten URL's.

Note: Although using Python Flask is a Hosted option, you could also use [this example](https://s3-us-west-2.amazonaws.com/sha-public-us-west-2/URLShortener/index.html) to host it as a web page on Amazon S3, for the complete serverless route. 

## Dependencies:

We need Flask, Gunicorn (optional) and Requests:

```bash
$ pip install flask gunicorn requests
```

## Application Code:

It's good practice to use a API Key for some level of security, but if not, you can just remove the headers section of `x-api-key`. 

The application relies on 3 environment variables: `APP_TITLE` - which is the banner name (defaults to "My URL Shortener" if none is set), `TINY_API_URL` - which is the URL to create the shortened url and `X_API_KEY` which is the api key for your API.

The content of `app.py` :

```python
from flask import Flask, render_template, request, url_for
import os
import sys
import socket
import requests
import json
import logging

tiny_api_url = os.getenv('TINY_API_URL', None)
tiny_api_key = os.getenv('X_API_KEY', None)
app_title = os.getenv('APP_TITLE', 'My URL Shortener')

if tiny_api_url == None or tiny_api_key == None:
    logging.error("Failed to load configuration")
    sys.exit(4)

headers = {'Content-Type': 'application/json', 'X-Api-Key': tiny_api_key}

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', app_title=app_title)

@app.route('/shortened', methods=['GET', 'POST'])
def search_request():
    user_url = request.form["input"]
    response = requests.post(
        tiny_api_url,
        headers=headers,
        data=json.dumps({
            "long_url": user_url
            }
        )
    )
    return render_template('results.html', app_title=app_title, res=response.content )

if __name__ == '__main__':
    app.run(passthrough_errors=False)
```

## JavaScript

We want to copy the value of the shortened url response to clipboard when clicking on a button. For that functionality, we need some javascript. 

```bash
$ mkdir -p static/js
$ touch static/js/clipboard.js
```

the content for our javascript function - `static/js/clipboard.js` :

```javascript
function copyToClipboard() {
  var copyText = document.getElementById("input");
  copyText.select();
  document.execCommand("Copy");
}
```

## HTML

The content for `templates/index.html` :

<script src="https://gist.github.com/ruanbekker/0c12fd81c94dc9019641dd536d704519.js"></script>

The content for `templates/results.html` :

<script src="https://gist.github.com/ruanbekker/01e27db70d4a2f60393b927697b2ca57.js"></script>

## Run the Server

Before we run the server, we need to set the environment variables as mentioned earlier:

```bash
TINY_API_URL=https://tiny-api.mydomain.com/create
X_API_KEY=someRandomSecretKey09876543210
```

Run the Server:

```bash
$ gunicorn -w 2 -b 0.0.0.0:8080 --access-logfile=/dev/stdout --error-log=/dev/stderr app:app
```

After booting the server, access the server on `http://localhost:8080/` and the response should look like:

![](https://user-images.githubusercontent.com/567298/50162763-c5c16e80-02e7-11e9-8744-a4c3c3c51f8e.png)

## Dockerizing this Application

The source code for this project is available on my [github repository](https://github.com/ruanbekker/flask-url-shortener-ui)

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

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


