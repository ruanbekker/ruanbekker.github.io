---
layout: post
title: "Basic RESTFul API Server with Python Flask"
date: 2018-04-21 19:35:34 -0400
comments: true
categories: ["python", "flask", "api", "restful-api"] 
---

![](https://user-images.githubusercontent.com/567298/53351527-18dc2100-392a-11e9-9e50-48f738046a68.jpg)

A Basic RESTFul API Service with Python Flask. We will be using the Flask, jsonify and request classes to build our API service.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## Description of this demonstration:

Our API will be able to do the following:

- Create, Read, Update, Delete

In this demonstration, we will add some information about people to our API, then go through each method that is mentioned above.

## Getting the Dependencies:

Setup the virtualenv and install the dependencies:

```bash
$ virtualenv .venv
$ source .venv/bin/activate
$ pip install flask
```

## The API Server Code:

Here's the complete code, as you can see I have a couple of decorators for each url endpoint, and a `id_generator` function, that will generate id's for each document. The id will be used for getting users information, updates and deletes:

```python
from flask import Flask, jsonify, request
from multiprocessing import Value

counter = Value('i', 0)
app = Flask(__name__)

a = []
help_message = """
API Usage:
 
- GET    /api/list
- POST   /api/add data={"key": "value"}
- GET    /api/get/<id>
- PUT    /api/update/<id> data={"key": "value_to_replace"}
- DELETE /api/delete/<id> 

"""

def id_generator():
    with counter.get_lock():
        counter.value += 1
        return counter.value

@app.route('/api', methods=['GET'])
def help():
    return help_message
    
@app.route('/api/list', methods=['GET'])
def list():
    return jsonify(a)

@app.route('/api/add', methods=['POST'])
def index():
    payload = request.json 
    payload['id'] = id_generator()
    a.append(payload)
    return "Created: {} \n".format(payload)

@app.route('/api/get', methods=['GET'])
def get_none():
    return 'ID Required: /api/get/<id> \n'

@app.route('/api/get/<int:_id>', methods=['GET'])
def get(_id):
    for user in a:
        if _id == user['id']:
            selected_user = user
    return jsonify(selected_user)

@app.route('/api/update', methods=['PUT'])
def update_none():
    return 'ID and Desired K/V in Payload required: /api/update/<id> -d \'{"name": "john"}\' \n'

@app.route('/api/update/<int:_id>', methods=['PUT'])
def update(_id):
    update_req = request.json
    key_to_update = update_req.keys()[0]
    update_val = (item for item in a if item['id'] == _id).next()[key_to_update] = update_req.values()[0]
    update_resp = (item for item in a if item['id'] == _id).next()
    return "Updated: {} \n".format(update_resp)

@app.route('/api/delete/<int:_id>', methods=['DELETE'])
def delete(_id):
    deleted_user = (item for item in a if item['id'] == _id).next()
    a.remove(deleted_user)
    return "Deleted: {} \n".format(deleted_user)

if __name__ == '__main__':
    app.run()
```

## Demo Time:

Retrieving the Help output:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api

API Usage:
 
- GET    /api/list
- POST   /api/add data={"key": "value"}
- GET    /api/get/<id>
- PUT    /api/update/<id> data={"key": "value_to_replace"}
- DELETE /api/delete/<id> 
```

Doing a list, to list all the users, its expected for it to be empty as we have not added any info to our API:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api/list
[]
```

Adding our first user:

```bash
$ curl -XPOST -H 'Content-Type: application/json' http://localhost:5000/api/add -d '{"name": "ruan", "country": "south africa", "age": 30}'
Created: {u'country': u'south africa', u'age': 30, u'name': u'ruan', 'id': 1} 
```

Adding our second user:

```bash
$ curl -XPOST -H 'Content-Type: application/json' http://localhost:5000/api/add -d '{"name": "stefan", "country": "south africa", "age": 29}'
Created: {u'country': u'south africa', u'age': 29, u'name': u'stefan', 'id': 2}
```

Doing a list again, will retrieve all our users:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api/list
[
  {
    "age": 30, 
    "country": "south africa", 
    "id": 1, 
    "name": "ruan"
  }, 
  {
    "age": 29, 
    "country": "south africa", 
    "id": 2, 
    "name": "stefan"
  }
]
```

Doing a GET on the userid, to only display the users info:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api/get/2
{
  "age": 29, 
  "country": "south africa", 
  "id": 2, 
  "name": "stefan"
}
```

Now, let's update some details. Let's say that Stefan relocated to New Zealand. We will need to provide his `id` and also the key/value that we want to update:

```bash
$ curl -XPUT -H 'Content-Type: application/json' http://localhost:5000/api/update/2 -d '{"country": "new zealand"}'
Updated: {u'country': u'new zealand', u'age': 29, u'name': u'stefan', 'id': 2} 
```

As you can see the response confirmed that the value was updated, but let's verify the output, by doing a get on his id:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api/get/2
{
  "age": 29, 
  "country": "new zealand", 
  "id": 2, 
  "name": "stefan"
}
```

And lastly, lets delete our user, which will only require the userid:

```bash
$ curl -XDELETE -H 'Content-Type: application/json' http://localhost:5000/api/delete/2
Deleted: {u'country': u'new zealand', u'age': 29, u'name': u'stefan', 'id': 2} 
```

To verify this, list all the users:

```bash
$ curl -XGET -H 'Content-Type: application/json' http://localhost:5000/api/list
[
  {
    "age": 30, 
    "country": "south africa", 
    "id": 1, 
    "name": "ruan"
  }
]
```

## Using Python Requests:

We can also use python's requests module to do the same, to give a demonstration I will create a new user:

```bash
$ pip install requests
$ python
```
```python
>>> import requests
>>> import json

>>> base_url = 'http://localhost:5000/api/add'
>>> headers = {"Content-Type": "application/json"}
>>> payload = json.dumps({"name": "shaun", "country": "australia", "age": 24})

>>> r = requests.post(base_url, headers=headers, data=payload)
>>> r.content
Created: {u'country': u'australia', u'age': 24, u'name': u'shaun', 'id': 4}
```

Thats it. I've stumbled upon [Flask-Restful](https://flask-restful.readthedocs.io/en/latest/) which I still want to check out, and as soon as I do, I will do a post on it, maybe baked with a NoSQL db or something like that.

Cheers!

## Resources:

- [Python Generator Expressions](https://stackoverflow.com/a/8653568)
- [Flask Docs](http://flask.pocoo.org/docs/0.12/api/#flask.Request)
