---
layout: post
title: "Experimenting with Python and TinyMongo a MongoDB wrapper for TinyDB"
date: 2018-04-15 16:39:22 -0400
comments: true
categories: ['python', 'mongodb', 'nosql', 'tinydb', 'databases'] 
---

[TinyMongo](https://github.com/schapman1974/tinymongo) is a wrapper for MongoDB on top of TinyDB.

This is awesome for testing, where you need a local document orientated database which is backed by a flat file. It feels just like using MongoDB, except that its local, lightweight and using TinyDB in the backend.

## Installing Dependencies:

```bash
$ pip install tinymongo
```

## Usage Examples:

Initialize tinymongo and create the database and collection:

```python
>>> from tinymongo import TinyMongoClient
>>> connection = TinyMongoClient('foo')
>>> db_init = connection.mydb
>>> db = db_init.users
```

Insert a Document, catch the document id and search for that document:

```python
>>> record_id = db .insert_one({'username': 'ruanb', 'name': 'ruan', 'age': 31, 'gender': 'male', 'location': 'south africa'}).inserted_id
>>> user_info = db.find_one({"_id": record_id})
>>> print(user_info)
{u'username': u'ruanb', u'name': u'ruan', u'gender': u'male', u'age': 31, u'_id': u'8d2ce01140ec11e888110242ac110004', u'location': u'south africa'}
```

Update a document: Update the age attribute from 31 to 32

```python
>>> db.users.update_one({'_id': '8d2ce01140ec11e888110242ac110004'}, {'$set': {'age': 32 }})
>>> print(user_info)
{u'username': u'ruanb', u'name': u'ruan', u'gender': u'male', u'age': 32, u'_id': u'8d2ce01140ec11e888110242ac110004', u'location': u'south africa'}
```

Insert some more data:

```python
>>> record_id = db .insert_one({'username': 'stefanb', 'name': 'stefan', 'age': 30, 'gender': 'male', 'location': 'south africa'}).inserted_id
>>> record_id = db .insert_one({'username': 'alexa', 'name': 'alex', 'age': 34, 'gender': 'male', 'location': 'south africa'}).inserted_id
```

Find all the users, sorted by descending age, oldest to youngest:

```python
>>> response = db.users.find(sort=[('age', -1)])
>>> for doc in response:
...     print(doc)
...
{u'username': u'alexa', u'name': u'alex', u'gender': u'male', u'age': 34, u'_id': u'66b1cc3d40ee11e892980242ac110004', u'location': u'south africa'}
{u'username': u'ruanb', u'name': u'ruan', u'gender': u'male', u'age': 32, u'_id': u'8d2ce01140ec11e888110242ac110004', u'location': u'south africa'}
{u'username': u'stefanb', u'name': u'stefan', u'gender': u'male', u'age': 30, u'_id': u'fbe9da8540ed11e88c5e0242ac110004', u'location': u'south africa'}
```

Find the number of documents in the collection:

```python
>>> db.users.find().count()
3
```

## Resources:

- [TinyMongo](https://github.com/schapman1974/tinymongo)
