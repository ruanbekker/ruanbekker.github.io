---
layout: post
title: "Rejoining or Bootstrapping MySQL Galera Cluster Nodes after Shutdown"
date: 2017-12-10 18:03:44 -0500
comments: true
categories: ["mysql", "galera", "clustering"] 
---

I have a 3 Node MySQL Galera Cluster that faced a shutdown on all 3 nodes at the same time, luckily this is only a testing environment, but at that time it was down and did not want to start up.

## Issues Faced

When trying to start MySQL the only error visible was:

```bash
$ /etc/init.d/mysql restart
 * MySQL server PID file could not be found!
Starting MySQL
........ * The server quit without updating PID file (/var/run/mysqld/mysqld.pid).
 * Failed to restart server.
```

At that time I can see that the galera port is started, but not mysql:

```bash
$ ps aux | grep mysql
root     23580  0.0  0.0   4508  1800 pts/0    S    00:37   0:00 /bin/sh /usr/bin/mysqld_safe --datadir=/var/lib/mysql --pid-file=/var/run/mysqld/mysqld.pid
mysql    24144  0.7 22.2 1185116 455660 pts/0  Sl   00:38   0:00 /usr/sbin/mysqld --basedir=/usr --datadir=/var/lib/mysql --plugin-dir=/usr/lib/mysql/plugin --user=mysql --log-error=/var/log/mysql/error.log --pid-file=/var/run/mysqld/mysqld.pid --socket=/var/run/mysqld/mysqld.sock --port=3306 --wsrep_start_position=long:string

$ netstat -tulpn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:4567            0.0.0.0:*               LISTEN      25507/mysqld
```

## Why?

More in detail is explained on a [SeveralNines Blog Post](https://severalnines.com/blog/how-bootstrap-mysqlmariadb-galera-cluster), but due to the fact that all the nodes left the cluster, one of the nodes needs to be started as a referencing point, before the other nodes can rejoin or bootstrapped to the cluster.

## Rejoining the Cluster

Consult the blog for more information, but from my end, I had a look at the node with the highest seqno and then updated `safe_to_bootstrap` to `1`: 

```bash
$ cat /var/lib/mysql/grastate.dat
# GALERA saved state
version: 2.1
uuid:    e9f9cf6a-87a1-11e7-9fb4-52612b906897
seqno:   123512
safe_to_bootstrap: 1
```

Then made sure that no mysql processes are running, then did a bootstrap:

```bash
$ /etc/init.d/mysql bootstrap
Bootstrapping the cluster
Starting MySQL
```

Then restarted mysql on the other nodes. 

## Verifying

To verify that all your nodes has checked in, I have 3 nodes:

```sql
mysql> SHOW STATUS LIKE 'wsrep_%';
+------------------------------+---------------------------------------------------+
| Variable_name                | Value                                             |
+------------------------------+---------------------------------------------------+
| wsrep_local_recv_queue_avg   | 0.000000                                          |
| wsrep_local_state_comment    | Synced                                            |
| wsrep_incoming_addresses     | 10.3.132.91:3306,10.4.1.201:3306,10.4.113.21:3306 |
| wsrep_evs_state              | OPERATIONAL                                       |
| wsrep_cluster_size           | 3                                                 |
| wsrep_cluster_status         | Primary                                           |
| wsrep_connected              | ON                                                |
+------------------------------+---------------------------------------------------+
```

or a shorter version:

```sql
mysql> SHOW GLOBAL STATUS LIKE 'wsrep_cluster_size';
+------------------------------+---------------------------------------------------+
| Variable_name                | Value                                             |
+------------------------------+---------------------------------------------------+
| wsrep_cluster_size           | 3                                                 |
+------------------------------+---------------------------------------------------+
```
