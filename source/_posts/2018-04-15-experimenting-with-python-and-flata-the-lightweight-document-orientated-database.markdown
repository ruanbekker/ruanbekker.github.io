---
layout: post
title: "Experimenting with Python and Flata the Lightweight Document Orientated Database"
date: 2018-04-15 15:09:25 -0400
comments: true
categories: ['python', 'nosql', 'databases', 'flata'] 
---

![](https://i.snag.gy/l298Y7.jpg)

[Flata](https://github.com/harryho/flata) is a lightweight document orientated database, which was inspired by [TinyDB](https://github.com/msiemens/tinydb) and [LowDB](https://github.com/typicode/lowdb).

## Why Flata?

Most of the times my mind gets in its curious states and I think about alternative ways on doing things, especially testing lightweight apps and today I wondered if theres any NoSQL-like software out there that is easy to spin up and is backed by a flat file, something like `sqlite` for SQL-like services, so this time just something for NoSQL-like.

So I stumbled upon TinyDB and Flata which is really easy to use and awesome!

## What will we be doing today:

- Create Database / Table
- Write to the Table
- Update Documents from the Table
- Scan the Table
- Query the Table
- Delete Documents from the Table
- Purge the Table

## Getting the Dependencies:

Flata is written in Python, so no external dependencies is needed. To install it:

```bash
$ pip install flata
```

## Usage Examples:

My home working directory:

```bash
$ pwd
/home/ruan
```

This will be the directory where we will save our database in `.json` format.

Import the Dependencies:

```python
>>> from flata import Flata, Query, where
>>> from flata.storages import JSONStorage
```

Create the Database file where all the data will be persisted:

```python
>>> db_init = Flata('mydb.json', storage=JSONStorage)
```

Create the collection / table, with a custom id field. If the resource already exists a retrieve will be done:

```python
>>> db_init.table('collection1', id_field = 'uid')
```

List the tables:

```python
>>> db_init.all()
{u'collection1': {}}
```

a get method can only be done if the resource exists, and we will assign it to the `db` object:

```python
>>> db = db_init.get('collection1')
``` 

Insert some data into our table:

```python
>>> db.insert({'username': 'ruanb', 'name': 'ruan', 'age': 31, 'gender': 'male', 'location': 'south africa'})
{'username': 'ruanb', 'uid': 1, 'gender': 'male', 'age': 31, 'location': 'south africa', 'name': 'ruan'}

>>> db.insert({'username': 'stefanb', 'name': 'stefan', 'age': 30, 'gender': 'male', 'location': 'south africa'})
{'username': 'stefanb', 'uid': 2, 'gender': 'male', 'age': 30, 'location': 'south africa', 'name': 'stefan'}

>>> db.insert({'username': 'mikec', 'name': 'mike', 'age': 28, 'gender': 'male', 'location': 'south africa'})
{'username': 'mikec', 'uid': 3, 'gender': 'male', 'age': 28, 'location': 'south africa', 'name': 'mike'}

>>> db.insert({'username': 'sam', 'name': 'samantha', 'age': 24, 'gender': 'female', 'location': 'south africa'})
{'username': 'sam', 'uid': 4, 'gender': 'female', 'age': 24, 'location': 'south africa', 'name': 'samantha'}

>>> db.insert({'username': 'michellek', 'name': 'michelle', 'age': 32, 'gender': 'female', 'location': 'south africa'})
{'username': 'michellek', 'uid': 5, 'gender': 'female', 'age': 32, 'location': 'south africa', 'name': 'michelle'}
```

Scan the whole table:

```python
>>> db.all()
[{u'username': u'ruanb', u'uid': 1, u'name': u'ruan', u'gender': u'male', u'age': 31, u'location': u'south africa'}, {u'username': u'stefanb', u'uid': 2, u'name': u'stefan', u'gender': u'male', u'age': 30, u'location': u'south africa'}, {u'username': u'mikec', u'uid': 3, u'name': u'mike', u'gender': u'male', u'age': 28, u'location': u'south africa'}, {u'username': u'sam', u'uid': 4, u'name': u'samantha', u'gender': u'female', u'age': 24, u'location': u'south africa'}, {u'username': u'michellek', u'uid': 5, u'name': u'michelle', u'gender': u'female', u'age': 32, u'location': u'south africa'}]
```

Query data from the table.

Query the table for the `username => ruanb`:

```python
>>> import json
>>> q = Query()

>>> response = db.search(q.username == 'ruanb')
>>> print(json.dumps(response, indent=2))
[
  {
    u'username': u'ruanb', 
    u'uid': 1, 
    u'name': u'ruan', 
    u'gender': u'male', 
    u'age': 31, 
    u'location': u'south africa'
  }
]
```

Query the table for everyone that is older than `29` and only `male` genders:

```python
>>> db.search(( q.gender == 'male' ) & (q.age >= 29 ))
[
  {
    u'username': u'ruanb', 
    u'uid': 1, 
    u'name': u'ruan', 
    u'gender': u'male', 
    u'age': 31, 
    u'location': u'south africa'
  }, 
  {
    u'username': u'stefanb', 
    u'uid': 2, 
    u'name': u'stefan', 
    u'gender': u'male', 
    u'age': 30, 
    u'location': u'south africa'
  }
]
```

Query the table for everyone that is younger than 25 or males:

```python
>>> db.search(( q.age < 25 ) | (q.gender == 'male' ) )
[
  {
    "username": "ruanb",
    "uid": 1,
    "name": "ruan",
    "gender": "male",
    "age": 31,
    "location": "south africa"
  },
  {
    "username": "stefanb",
    "uid": 2,
    "name": "stefan",
    "gender": "male",
    "age": 30,
    "location": "south africa"
  },
  {
    "username": "mikec",
    "uid": 3,
    "name": "mike",
    "gender": "male",
    "age": 28,
    "location": "south africa"
  },
  {
    "username": "sam",
    "uid": 4,
    "name": "samantha",
    "gender": "female",
    "age": 24,
    "location": "south africa"
  }
]
```

Update the location value: Lets say Samantha relocated to New Zealand, and we need to update her location from `South Africa` to `New Zealand`:

```python
>>> db.update({'location': 'new zealand'}, where('username') == 'sam' )
([4], [{u'username': u'sam', u'uid': 4, u'name': u'samantha', u'gender': u'female', u'age': 24, u'location': 'new zealand'}])

>>> db.search(q.username == 'sam')
[{u'username': u'sam', u'uid': 4, u'name': u'samantha', u'gender': u'female', u'age': 24, u'location': u'new zealand'}]
```

Delete a document by its id:

```python
>>> db.remove(ids=[4])
([4], [])
```

Delete all documents matching a query, for this example, all people with the gender: `male`:

```python
>>> db.remove(q.gender == 'male')
([1, 2, 3], [])
```

Delete all the data in the table:

```python
>>> db.purge()
```

When we exit, you will find the database file, which we created:

```bash
$ ls
mydb.json
```

## Resources:

- [Flata](https://github.com/harryho/flata)
- [TinyDB](https://github.com/msiemens/tinydb)
