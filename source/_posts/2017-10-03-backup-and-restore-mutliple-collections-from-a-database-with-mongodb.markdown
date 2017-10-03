---
layout: post
title: "Backup and Restore Mutliple Collections from a Database with MongoDB"
date: 2017-10-03 16:42:34 -0400
comments: true
categories: ["mongodb", "backups", "rocketchat", "mlab"] 
---

From a previous post we've  [Setup a MongoDB Cluster](http://blog.ruanbekker.com/blog/2017/09/02/setup-a-3-node-mongodb-replica-set-on-ubuntu-16/), and in this post we will go through the steps of backing up a database and restoring it to another mongodb cluster.

[MLab](http://mlab.com/) offers a free Shared MongoDB Hosted Service with a limitation of 500MB, which I will be using to restore my data from my own hosted cluster to the free MLab service.

## Create the MongoDB Backup

First we will need to create our backup path, and then backup our database, in my case, I am backing up my `rocketchat` database:

```bash
$ mkdir -p /opt/backups/mongodb
$ mongodump --host mongodb.example.com --port 27017 -u <mongouser> --authenticationDatabase <authdb> --db rocketchat --out /opt/backups/mongodb/
```

Change into the backup directory:

```bash
$ cd /opt/backups/mongodb/rocketchat/ 
```

You will find the `bson` and `json metadata` files for each collection:

```bash
$ ls -l | awk '{print $9}' | head -9
custom_emoji.chunks.bson
custom_emoji.chunks.metadata.json
custom_emoji.files.bson
custom_emoji.files.metadata.json
instances.bson
instances.metadata.json
meteor_accounts_loginServiceConfiguration.bson
meteor_accounts_loginServiceConfiguration.metadata.json
...
```

## Restore MongoDB Database 

We will need to restore all the collections to our new mongodb service, I have created a bash script (`restore-mongodb.sh`) that will restore each collection to our `rocketchat` database:

```bash
#!/usr/bin/env bash

mongo_user=<mongouser>
mongo_pass=<mongopass>

for file in `ls | grep bson`
  do
    for collection in `echo $file | sed 's/.bson//g'`
  do
    mongorestore --host mymongoid.mlab.com --port 12345 -u $mongo_user -p $mongo_pass -d rocketchat -c $collection $file
    sleep 2
  done
done
```

Change the permissions of your script to make it executable and execute the script:

```
$ chmod +x restore-mongodb.sh
$ ./restore-mongodb.sh

2017-10-03T22:05:39.138+0200    checking for collection data in custom_emoji.chunks.bson
2017-10-03T22:05:39.159+0200    reading metadata for rocketchat.custom_emoji.chunks from custom_emoji.chunks.metadata.json
2017-10-03T22:05:39.211+0200    restoring rocketchat.custom_emoji.chunks from custom_emoji.chunks.bson
2017-10-03T22:05:39.900+0200    restoring indexes for collection rocketchat.custom_emoji.chunks from metadata
2017-10-03T22:05:39.922+0200    finished restoring rocketchat.custom_emoji.chunks (20 documents)
2017-10-03T22:05:39.922+0200    done
2017-10-03T22:05:42.188+0200    checking for collection data in custom_emoji.files.bson
2017-10-03T22:05:42.231+0200    reading metadata for rocketchat.custom_emoji.files from custom_emoji.files.metadata.json
2017-10-03T22:05:42.252+0200    restoring rocketchat.custom_emoji.files from custom_emoji.files.bson
2017-10-03T22:05:42.623+0200    restoring indexes for collection rocketchat.custom_emoji.files from metadata
2017-10-03T22:05:42.645+0200    finished restoring rocketchat.custom_emoji.files (20 documents)
2017-10-03T22:05:42.645+0200    done
...
```

## Checkout the New MongoDB Database:

Once the restore has been done, logon to your new mongodb database and have a look at the collections in the database:

```
$ mongo mymongoid.mlab.com:12345/rocketchat -u <mongouser> -p
MongoDB shell version v3.4.7
Enter password:
connecting to: mongodb://mymongoid.mlab.com:12345/rocketchat
MongoDB server version: 3.4.9

rs-mymongoid:PRIMARY> show collections
_raix_push_app_tokens
_raix_push_notifications
custom_emoji.chunks
custom_emoji.files
instances
```

## Resources:

- https://docs.mongodb.com/manual/reference/program/mongodump/
- https://docs.mongodb.com/manual/reference/program/mongorestore/
