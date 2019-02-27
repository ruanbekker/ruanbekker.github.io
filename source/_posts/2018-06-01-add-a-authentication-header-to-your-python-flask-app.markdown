---
layout: post
title: "Add a Authentication Header to your Python Flask App"
date: 2018-06-01 03:28:05 -0400
comments: true
categories: ["python", "flask", "web-development", "security", "authentication", "api"] 
---

![](https://user-images.githubusercontent.com/567298/53351527-18dc2100-392a-11e9-9e50-48f738046a68.jpg)

We will write a simple Python Flask application that requires authentication in order to respond with a 200 HTTP Status code.

## Python Flask Application:

Our Python Flask application will require the Header `x-api-key dhuejso2dj3d0` in the HTTP Request, to give us a 200 HTTP Status code, if not, we will respond with a 401 Unauthorized Response:

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    headers = request.headers
    auth = headers.get("X-Api-Key")
    if auth == 'asoidewfoef':
        return jsonify({"message": "OK: Authorized"}), 200
    else:
        return jsonify({"message": "ERROR: Unauthorized"}), 401

if __name__ == '__main__':
    app.run()
```

To get the headers, you can use `headers.get("X-Api-Key")` or `headers["X-Api-Key"]`


Create a virtual environment, install flask and run the app:

```bash
$ virtualenv .venv
$ source .venv/bin/activate
$ python app.py
 * Serving Flask app "app" (lazy loading)
 * Environment: production
   WARNING: Do not use the development server in a production environment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```

## Requests to our App:

Let's first make a request with no headers, which should then give us a 401 Unautorhized response:

```bash
$ curl -i http://localhost:5000

HTTP/1.0 401 UNAUTHORIZED
Content-Type: application/json
Content-Length: 33
Server: Werkzeug/0.14.1 Python/3.6.5
Date: Fri, 01 Jun 2018 07:26:25 GMT

{"message":"ERROR: Unauthorized"}
``` 

Now let's include the authentication token in our headers. If the string is the same as the one in the code, we should see a 200 HTTP Response:

```bash
$ curl -i -H 'x-api-key: asoidewfoef' http://localhost:5000

HTTP/1.0 200 OK
Content-Type: application/json
Content-Length: 29
Server: Werkzeug/0.14.1 Python/3.6.5
Date: Fri, 01 Jun 2018 07:27:03 GMT

{"message":"OK: Authorized"}
```

## Note:

From a best practice, its not a good decision to hard code sensitive details in your code, but rather read that from an encrypted database and store that in your applications environment variables, and let your application read from the environment variables, something like that :D


