---
layout: post
title: "Run a Basic Python Flask Restful API"
date: 2022-03-20 17:33:17 -0400
comments: true
categories: ["python", "flask", "flask-restful"]
---

In this tutorial we will run a basic api using flask-restful, it will only have one route which is a get method for the purpose of demonstration.

## What is Flask Restful

[Flask-RESTful](https://flask-restful.readthedocs.io/en/latest/index.html) is an extension for [Flask](https://flask.palletsprojects.com/en/2.0.x/) that adds support for quickly building REST APIs. It is a lightweight abstraction that works with your existing ORM/libraries. Flask-RESTful encourages best practices with minimal setup.

If you want to see a basic Flask API post, you can follow the link below:
- https://blog.ruanbekker.com/blog/2018/11/27/python-flask-tutorial-series-create-a-hello-world-app-p1/

## Installation

Install Flask and Flask Restful:

```bash
python3 -m pip install flask
python3 -m pip install flask-restful
```

## Code

The basic code we will have is to have one get method available that will return `{"hello": "world"}`:

```python
import flask
import flask_restful

app = flask.Flask(__name__)
api = flask_restful.Api(app)

class HelloWorld(flask_restful.Resource):
    def get(self):
        return {'hello': 'world'}

api.add_resource(HelloWorld, '/')

if __name__ == "__main__":
    app.run(debug=True)
```

## Run the Server

Run the server:

```bash
python api.py
```

Then make a get request:

```bash
curl http://localhost:5000/
```

The response should be the following:

```json
{
    "hello": "world"
}
```

## Integration Tests

We can setup integration tests with `unittest` by creating `test_api.py`:

```python
import unittest
import app as api

class TestFlaskApi(unittest.TestCase):
    def setUp(self):
        self.app = api.app.test_client()

    def test_hello_world(self):
        response = self.app.get("/")
        self.assertEqual(
            response.get_json(),
            {"hello": "world"},
        )

if __name__ == '__main__':
    unittest.main()
```

Then we can run our test with:

```bash
python -m unittest discover -p test_app.py
```

Since our test is expecting `{"hello": "world"}` and our server is returning that the output of our tests should be:

```bash
.
----------------------------------------------------------------------
Ran 1 test in 0.007s

OK
```

## More on Flask-Restful

This was a very basic example and their [documentation](https://flask-restful.readthedocs.io/en/latest/quickstart.html) provides a great tutorial on how to extend from this example.

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

