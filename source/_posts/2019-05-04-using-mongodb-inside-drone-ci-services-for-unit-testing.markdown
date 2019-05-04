---
layout: post
title: "Using MongoDB inside Drone CI Services for Unit Testing"
date: 2019-05-04 14:52:37 -0400
comments: true
categories: ["mongodb", "drone", "cicd", "devops", "bash"] 
---

![](https://user-images.githubusercontent.com/567298/57184017-4b1f7700-6eb5-11e9-886d-4b811687221a.png)

Another nice thing about Drone CI is the "Services" configuration within your pipeline. At times your unit or integration testing steps might be dependent of a database such as MongoDB, MySQL etc. 

Drone allows you to spin up a ephemeral database service such as MongoDB using a Docker container as the fist step within your pipeline, defined in the services section. This step will always run first. 

The service container will be reachable via the configured container name as its hostname. Keep note that if you run multiple paralel jobs that the service container will only be reachable from the container where the mongodb container is running.

## What are we doing today

We will setup a really basic (and a bit useless) pipeline that will spin up a mongodb service container, use a step to write random data to mongodb and a step that reads data from mongodb.

For demonstration purposes, the data is really random but more focused on the service section.

All the source code for this demonstration is available on my **[github repository](https://github.com/ruanbekker/demo-drone-mongodb-tests)**

## Our Drone Pipeline

First we define our service, mongodb. Once the mongodb service is running, we will have our build step, our step that runs the mongodb version against our database, write data into our mongodb database, then read the data from mongodb, then the last step running a shell command with the date.

Our `.drone.yml` pipeline definition:

```yaml
---
kind: pipeline
name: mongotests

services:
- name: mongo
  image: mongo:4
  command: [ --smallfiles ]
  ports:
  - 27017

steps:
- name: build-step
  image: alpine
  commands:
  - echo "this should be a step that does something"
  
- name: mongodb-return-version
  image: mongo:4
  commands:
  - date
  - mongo --host mongo --eval "db.version()"
  
- name: mongodb-test-writes
  image: mongo:4
  commands:
  - date
  - sh scripts/write_mongo.sh

- name: mongodb-test-reads
  image: mongo:4
  commands:
  - date
  - sh scripts/read_mongo.sh

- name: last-step
  image: alpine
  commands:
  - echo "completed at $(date)"
```

Our scripts referenced in our steps:

The first will be our script that write random data into mongodb, `scripts/write_mongo.sh`:

```bash
#!/bin/sh
set -ex
echo "start writing"
mongo mongo:27017/mydb scripts/write.js
echo "done writing"
```

We are referencing a `scripts/write.js` file which is a function that randomizes data and generates a 1000 documents to write to mongodb:

```javascript
var txs = []
for (var x = 0; x < 1000 ; x++) {
 var transaction_types = ["credit card", "cash", "account"];
 var store_names = ["edgards", "cna", "makro", "picknpay", "checkers"];
 var random_transaction_type = Math.floor(Math.random() * (2 - 0 + 1)) + 0;
 var random_store_name = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
 txs.push({
   transaction: 'tx_' + x,
   transaction_price: Math.round(Math.random()*1000),
   transaction_type: transaction_types[random_transaction_type],
   store_name: store_names[random_store_name]
   });
}
db.mycollection.insert(txs)
```

Our script that will read data from mongodb, `scripts/read_mongo.sh`:

```
#!/bin/sh
set -ex
echo "start reading"
mongo mongo:27017/mydb <<EOF
db.mycollection.find().count();
db.mycollection.find({transaction_price: { \$gt: 990}}).forEach( printjson );
EOF
echo "done reading"
```

The `README.md` to include the build status:

```
## project-name ![](https://cloud.drone.io/api/badges/<user-name>/<project-name>/status.svg?branch=master)
```

Once your source code is set in github, enable the repository on drone and push to github to trigger the build.

## Demo and Screenshots

After pushing to github to trigger the build, heading over to drone, I can see that mongodb is running and our step has completed that executes the `db.version()` against mongodb:

![](https://user-images.githubusercontent.com/567298/57183883-317d3000-6eb3-11e9-9aa0-7dd729514033.png)

Next our step executes to write the random data into mongodb:

![](https://user-images.githubusercontent.com/567298/57183911-989ae480-6eb3-11e9-942a-a9c1af191b7f.png)

After the data has been written to mongodb, our next step will read the number of documents from mongodb, and also run a query for transaction prices more than 990:

![](https://user-images.githubusercontent.com/567298/57183917-bc5e2a80-6eb3-11e9-802d-87e268b2fc43.png)

Once that has completed, we will have a shell command returning the time when the last step completed:

![](https://user-images.githubusercontent.com/567298/57183934-fa5b4e80-6eb3-11e9-9eb3-e58248e2286c.png)

## Resources

- [Drone Hosted Service](https://cloud.drone.io)
- [Drone Services Documentation](https://docs.drone.io/user-guide/pipeline/services/)
- [Github Repository](https://github.com/ruanbekker/demo-drone-mongodb-tests)
