---
layout: post
title: "Queries Failing via Beeline due to Anonymous User"
date: 2019-04-28 12:25:12 -0400
comments: true
categories: ["bigdata", "hadoop", "beeline", "hive"] 
---

Beeline Error: `FAILED: Execution Error, return code 1 from org.apache.hadoop.hive.ql.exec.tez.TezTask (state=08S01,code=1)`

## Issue:

Some time ago, I assisted a customer who was trying to do a select count(*) via beeline and failed with:

```
[hadoop@ip-10-10-9-226 ~]$ beeline -u jdbc:hive2://nn-emr.sysint.dxone.local:10000/default --silent=true --outputformat=csv2 -e "select count(*) from basetables_rms.rms_site"
19/04/26 06:41:15 [main]: WARN jdbc.HiveConnection: Request to set autoCommit to false; Hive does not support autoCommit=false.
Error: Error while processing statement: FAILED: Execution Error, return code 1 from org.apache.hadoop.hive.ql.exec.tez.TezTask (state=08S01,code=1)
```

When reproducing this I found a jira: https://issues.apache.org/jira/browse/HIVE-14631 which related to the same issue and the workaround was to switch your execution engine to mapreduce. By doing that, it worked, but wanted a better resolution for the customer.


## Debugging:

When setting enabling debugging, I found that the error is related to permissions:

```
$ beeline  -u jdbc:hive2://172.31.31.247:10000/default --silent=false --outputformat=csv2 -e "select count(*) from testdb.users"
Connecting to jdbc:hive2://172.31.31.247:10000/default
Connected to: Apache Hive (version 2.1.1-amzn-0)
Driver: Hive JDBC (version 2.1.1-amzn-0)
19/04/26 10:24:01 [main]: WARN jdbc.HiveConnection: Request to set autoCommit to false; Hive does not support autoCommit=false.
...
ERROR : Failed to execute tez graph.
org.apache.hadoop.security.AccessControlException: Permission denied: user=anonymous, access=WRITE, inode="/user/anonymous":hdfs:hadoop:drwxr-xr-x
```

So it seems that when the client (anonymous) is trying to copy the hive execution jar to is home path in HDFS, in this case (/home/anonymous/.hiveJars/) it fails due to permissions.

## Resolution:

By passing the hadoop user, I was able to get the expected results:

```
$ beeline -n hadoop -u jdbc:hive2://172.31.31.247:10000/default --silent=false --outputformat=csv2 -e "select count(*) from testdb.users"
INFO  : Completed executing command(queryId=hive_20190426103246_33253d86-3ebc-462f-a5a1-f01877dd00a8); Time taken: 17.08 seconds
INFO  : OK
c0
1
1 row selected (17.282 seconds)
```

Listing the mentioned jar:

```
$ hdfs dfs -ls /user/hadoop/.hiveJars/
Found 1 items
-rw-r--r--   1 hadoop hadoop   32447131 2019-04-26 09:51 /user/hadoop/.hiveJars/hive-exec-2.1.1-amzn-0-ac46be4721493d9e62fd1b132ecee3d20fd283680edbc0cfa9809c656a493469.jar
```

Hope this might help someone facing the same issue
