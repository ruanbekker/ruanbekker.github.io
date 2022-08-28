---
layout: post
title: "Setup MongoDB Server on ARM64 using Scaleway"
date: 2018-04-01 18:46:27 -0400
comments: true
categories: ["scaleway", "nosql", "arm64", "mongodb", "linux"] 
---

![](https://preview.ibb.co/bBRhn7/scw.png)

I've been using Scaleway for the past 18 months and I must admit, I love hosting my Applications on their Infrastructure. They have expanded rapidly recently, and currently deploying more infrstructure due to the high demand. 

Scaleway is a Cloud Division of Online.net. They provide Baremetal and Cloud SSD Virtual Servers. Im currently hosting a Docker Swarm Cluster, Blogs, Payara Java Application Servers, Elasticsearch and MongoDB Clusters with them and really happy with the performance and stability of their services.

## What will we be doing today:

Today I will be deploying MongoDB Server on a ARM64-2GB Instance, which costs you 2.99 Euros per month, absolutely awesome pricing! After we install MongoDB we will setup authentication, and then just a few basic examples on writing and reading from MongoDB.

## Getting Started:

Logon to [cloud.scaleway.com](cloud.scaleway.com) then launch an instance, which will look like the following:

![](https://image.ibb.co/e7T9jn/scw_launch.png)

After you deployed your instance, SSH to your instance, and it should look like this:

![](https://preview.ibb.co/k16C4n/scw_ssh.png)

## Dependencies:

Get the repository and install MongoDB:

```bash
$ apt update
$ apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
$ echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
$ apt update && apt upgrade -y
$ apt install mongodb-org -y
```

Enable MongoDB on Boot:

```bash
$ systemctl enable mongod
```

## Configuration:

Your configuration might look different from mine, so I recommend to backup your config first, as the following command will overwrite the config to the configuration that I will be using for this demonstration:

```bash
$ cat > /etc/mongod.conf << EOF
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: false

storage:
  mmapv1:
    smallFiles: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 0.0.0.0

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOF
```

Restart MongoDB for the config changes to take affect:

```bash
$ systemctl restart mongod
```

## Authentication:

Create the Authentication:

```bash
$ mongo
MongoDB shell version v3.6.3
connecting to: mongodb://127.0.0.1:27017
MongoDB server version: 3.6.3
Welcome to the MongoDB shell.

> use admin
> db.createUser({user: "ruan", pwd: "pass123", roles:[{role: "root", db: "admin"}]})
Successfully added user: {
        "user" : "ruan",
        "roles" : [
                {
                        "role" : "root",
                        "db" : "admin"
                }
        ]
}

> exit
```

Restart MongoDB and logon with your credentials:

```bash
$ systemctl restart mongod

$ mongo --authenticationDatabase admin --host localhost --port 27017 -u ruan -p
MongoDB shell version v3.6.3
Enter password:
connecting to: mongodb://localhost:27017/
MongoDB server version: 3.6.3
>
```

## Write and Read from MongoDB

While you are on the MongoDB Shell, we will insert a couple of documents, first drop in to the database that you would like to write to:

```bash
> use testdb
switched to db testdb
```

Now we will write to the collection: `collection1`:

```bash
> db.collection1.insert({"name": "ruan", "surname": "bekker", "age": 31, "country": "south africa"})
WriteResult({ "nInserted" : 1 })

> db.collection1.insert({"name": "stefan", "surname": "bester", "age": 30, "country": "south africa"})
WriteResult({ "nInserted" : 1 })
```

To find all the documents in our collection:

```bash
> db.collection1.find()
{ "_id" : ObjectId("5ac15ff0f4a5500484defd23"), "name" : "ruan", "surname" : "bekker", "age" : 31, "country" : "south africa" }
{ "_id" : ObjectId("5ac16003f4a5500484defd24"), "name" : "stefan", "surname" : "bester", "age" : 30, "country" : "south africa" }
```

To prettify the output:

```bash
> db.collection1.find().pretty()
{
        "_id" : ObjectId("5ac15ff0f4a5500484defd23"),
        "name" : "ruan",
        "surname" : "bekker",
        "age" : 31,
        "country" : "south africa"
}
{
        "_id" : ObjectId("5ac16003f4a5500484defd24"),
        "name" : "stefan",
        "surname" : "bester",
        "age" : 30,
        "country" : "south africa"
}
```

To find a document with the key/value of `name: ruan`:

```bash
> db.collection1.find({"name": "ruan"}).pretty()
{
        "_id" : ObjectId("5ac15ff0f4a5500484defd23"),
        "name" : "ruan",
        "surname" : "bekker",
        "age" : 31,
        "country" : "south africa"
}
```

To view the database that you are currently switched to:

```bash
> db
testdb
```

To view all the databases:

```bash
> show dbs
admin   0.000GB
config  0.000GB
local   0.000GB
testdb  0.000GB
```

To view the collections in the database:

```bash
> show collections
collection1

> exit
```

That was just a quick post on installing MongoDB on ARM64 using Scaleway. Try them out, and they are also hiring: [careers.scaleway.com](https://careers.scaleway.com/)
