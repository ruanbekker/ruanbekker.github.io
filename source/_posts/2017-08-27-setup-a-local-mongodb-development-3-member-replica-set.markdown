---
layout: post
title: "Setup a Local MongoDB Development 3 Member Replica Set"
date: 2017-08-27 01:10:16 -0400
comments: true
categories: ["mongodb", "nosql", "clustering", "databases"] 
---

Setup a Development Environment of a MongoDB Replica Set consisting of 3 mongod MongoDB Instances.

This is purely aimed for a testing or development environment, as one of the key points is that security is disabled, and that for this post, all 3 instances will be running on the same node.

## Resources:

- https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
- https://docs.mongodb.com/manual/tutorial/deploy-replica-set-for-testing/

## Installation:

I am using Ubuntu 16.04, for other distributions, have a look at [MongoDBs Installation Page](https://docs.mongodb.com/manual/administration/install-community/)

```bash MongoDB Installation
# sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
# echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
# apt update
# apt install -y mongodb-org -y
```

## Prepare Directories:

Prepare the data directories, and as I am planning to use the `--fork` option, I need to specify the the `--logpath`, so therefore I will create the log directories as well:

```bash Create the Directory Paths
$ mkdir -p /srv/mongodb/rs0-0 /srv/mongodb/rs0-1 /srv/mongodb/rs0-2
$ mkdir -p /var/log/mongodb/rs0-0 /var/log/mongodb/rs0-1 /var/log/mongodb/rs0-2
```

## Run 3 MongoDB Instances:

Create 3 MongoDB Instances, each instance listening on it's unique port.

From MongoDB's Documentation:
> "The --smallfiles and --oplogSize settings reduce the disk space that each mongod instance uses"

```
$ mongod --port 27017 --dbpath /srv/mongodb/rs0-0 --replSet rs0 --smallfiles --oplogSize 128 --logpath /var/log/mongodb/rs0-0/server.log --fork
$ mongod --port 27018 --dbpath /srv/mongodb/rs0-1 --replSet rs0 --smallfiles --oplogSize 128 --logpath /var/log/mongodb/rs0-1/server.log --fork
$ mongod --port 27019 --dbpath /srv/mongodb/rs0-2 --replSet rs0 --smallfiles --oplogSize 128 --logpath /var/log/mongodb/rs0-2/server.log --fork
```

## Cofirm:

Confirm that the processes are listening on the ports that we defined:

```
$ netstat -tulpn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:27017           0.0.0.0:*               LISTEN      1100/mongod
tcp        0      0 0.0.0.0:27018           0.0.0.0:*               LISTEN      1127/mongod
tcp        0      0 0.0.0.0:27019           0.0.0.0:*               LISTEN      1154/mongod
```

## Connect to the first MongoDB Instnace:

Connect to our first MongoDB Instance, where we will setup the replica set:

```
$ mongo --port 27017
\>
```

Create the Replica Set Configuration Object:

```
> rsconf = {
             _id: "rs0",
             members: [
                        {
                         _id: 0,
                         host: "10.78.1.24:27017"
                        }
                      ]
           }
```

Initiate the replica set configuration:

```
> rs.initiate( rsconf )
{ "ok" : 1 }
```

Display the Replica Configuration with `rs.conf()`:

```
rs0:SECONDARY> rs.conf()
{
        "_id" : "rs0",
        "version" : 1,
        "protocolVersion" : NumberLong(1),
        "members" : [
                {
                        "_id" : 0,
                        "host" : "10.78.1.24:27017",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {

                        },
                        "slaveDelay" : NumberLong(0),
                        "votes" : 1
                }
        ],
        "settings" : {
                "chainingAllowed" : true,
                "heartbeatIntervalMillis" : 2000,
                "heartbeatTimeoutSecs" : 10,
                "electionTimeoutMillis" : 10000,
                "catchUpTimeoutMillis" : 60000,
                "getLastErrorModes" : {

                },
                "getLastErrorDefaults" : {
                        "w" : 1,
                        "wtimeout" : 0
                },
                "replicaSetId" : ObjectId("59a2339f5ff27709a1645d28")
        }
}
```

Add the other two mongodb instances to the replica set using `rs.add()`:

```bash
rs0:PRIMARY> rs.add("10.78.1.24:27018")
{ "ok" : 1 }

rs0:PRIMARY> rs.add("10.78.1.24:27019")
{ "ok" : 1 }
```

View the status of our MongoDB Replica Set with `rs.status()`:

```bash
rs0:PRIMARY> rs.status()
```
```json
{
        "set" : "rs0",
        "date" : ISODate("2017-08-27T02:52:08.106Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "heartbeatIntervalMillis" : NumberLong(2000),
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1503802316, 1),
                        "t" : NumberLong(1)
                },
                "appliedOpTime" : {
                        "ts" : Timestamp(1503802316, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1503802316, 1),
                        "t" : NumberLong(1)
                }
        },
        "members" : [
                {
                        "_id" : 0,
                        "name" : "10.78.1.24:27017",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 890,
                        "optime" : {
                                "ts" : Timestamp(1503802316, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2017-08-27T02:51:56Z"),
                        "infoMessage" : "could not find member to sync from",
                        "electionTime" : Timestamp(1503802272, 1),
                        "electionDate" : ISODate("2017-08-27T02:51:12Z"),
                        "configVersion" : 3,
                        "self" : true
                },
                {
                        "_id" : 1,
                        "name" : "10.78.1.24:27018",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 16,
                        "optime" : {
                                "ts" : Timestamp(1503802316, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1503802316, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2017-08-27T02:51:56Z"),
                        "optimeDurableDate" : ISODate("2017-08-27T02:51:56Z"),
                        "lastHeartbeat" : ISODate("2017-08-27T02:52:06.638Z"),
                        "lastHeartbeatRecv" : ISODate("2017-08-27T02:52:07.638Z"),
                        "pingMs" : NumberLong(0),
                        "syncingTo" : "10.78.1.24:27017",
                        "configVersion" : 3
                },
                {
                        "_id" : 2,
                        "name" : "10.78.1.24:27019",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 11,
                        "optime" : {
                                "ts" : Timestamp(1503802316, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1503802316, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2017-08-27T02:51:56Z"),
                        "optimeDurableDate" : ISODate("2017-08-27T02:51:56Z"),
                        "lastHeartbeat" : ISODate("2017-08-27T02:52:06.638Z"),
                        "lastHeartbeatRecv" : ISODate("2017-08-27T02:52:07.241Z"),
                        "pingMs" : NumberLong(0),
                        "configVersion" : 3
                }
        ],
        "ok" : 1
}
```


## Write some Data to MongoDB:

Create a Database named `mydb`: 

```bash
rs0:PRIMARY> use mydb
switched to db mydb
```

Create a Collection, named `mycol1`:

```bash
rs0:PRIMARY> db.createCollection("mycol1")
{ "ok" : 1 }

rs0:PRIMARY> show collections
mycol1
```

Write 2 documents with:

- Name: James, Home Address: Country => South Africa, City => Cape Town
- Name: Frank, Home Address: Country => Ireland, City => Dublin

```bash Write some Data
rs0:PRIMARY> db.mycol1.insert({"name": "james", "home address": {"country": "south africa", "city": "cape town"}})
WriteResult({ "nInserted" : 1 })

rs0:PRIMARY> db.mycol1.insert({"name": "frank", "home address": {"country": "ireland", "city": "dublin"}})
WriteResult({ "nInserted" : 1 })
```

Count all Documents in our Database:

```bash Counting
rs0:PRIMARY> db.mycol1.find().count()
2
```

Scan through all documents, and show the in `pretty print`:

```bash Pretty Print
rs0:PRIMARY> db.mycol1.find().pretty()
{
        "_id" : ObjectId("59a23d26c0c3824694f79ff6"),
        "name" : "james",
        "home address" : {
                "country" : "south africa",
                "city" : "cape town"
        }
}
{
        "_id" : ObjectId("59a23dbdc0c3824694f79ff7"),
        "name" : "frank",
        "home address" : {
                "country" : "ireland",
                "city" : "dublin"
        }
}
```

Find Information about `Frank`:

```bash Franks Info
rs0:PRIMARY> db.mycol1.find({"name": "frank"})
{ "_id" : ObjectId("59a23dbdc0c3824694f79ff7"), "name" : "frank", "home address" : { "country" : "ireland", "city" : "dublin" } }
```

Delete the Database, but confirm which database your are logged on, the delete using `dropDatabase()`:

```bash Drop Database
rs0:PRIMARY> db
mydb

rs0:PRIMARY> db.dropDatabase()
{ "dropped" : "mydb", "ok" : 1 }

rs0:PRIMARY> exit
bye
```

