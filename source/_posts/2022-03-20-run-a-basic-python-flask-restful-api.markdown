---
layout: post
title: "Run a Basic Python Flask Restful API"
date: 2022-03-20 17:33:17 -0400
comments: true
categories: ["python", "flask", "flask-restful"]
---

In this tutorial we will run a basic api using flask-restful, it will only have two routes which will be a get and post method for the purpose of demonstration.

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

The basic code that we have, is to have two methods available (get and post):

```python
import flask
import flask_restful

app = flask.Flask(__name__)
api = flask_restful.Api(app)

class HelloWorld(flask_restful.Resource):
    def get(self):
        return {'hello': 'world'}

    def post(self):
        json_data = request.get_json(force=True)
        firstname = json_data['firstname']
        lastname = json_data['lastname']
        return jsonify(firstname=firstname, lastname=lastname)

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

Then make a post request:

```bash
curl -XPOST http://localhost:5000/ -d '{"firstname": "ruan", "lastname": "bekker"}'
```

The response should look something like this:

```json
{
  "firstname": "ruan",
  "lastname": "bekker"
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

    def test_get_method(self):
        response = self.app.get("/")
        self.assertEqual(
            response.get_json(),
            {"hello": "world"},
        )

    def test_post_method(self):
        # request payload
        payload = json.dumps({
            "firstname": "ruan",
            "lastname": "bekker"
        })

        # make request
        response = self.app.post("/", data=payload, headers={"Content-Type": "application/json"})

        # assert
        self.assertEqual(str, type(response.json['lastname']))
        self.assertEqual(200, response.status_code)

    def tearDown(self):
        # delete if anything was created
        pass

if __name__ == '__main__':
    unittest.main()
```

Then we can run our test with:

```bash
python -m unittest discover -p test_app.py -v
```

Since our first test is expecting `{"hello": "world"}` our test will pass, and our second test we are validating that our post request returns a 200 response code and that our lastname field is of string type.

The output of our tests will show something like this:

```bash
test_get_request (test_app.TestFlaskApi) ... ok
test_post_request (test_app.TestFlaskApi) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.009s

OK
```

## More on Flask-Restful

This was a very basic example and their [documentation](https://flask-restful.readthedocs.io/en/latest/quickstart.html) provides a great tutorial on how to extend from this example. This is also a [great blogpost](https://dev.to/paurakhsharma/flask-rest-api-part-6-testing-rest-apis-4lla) on testing rest api's.

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

