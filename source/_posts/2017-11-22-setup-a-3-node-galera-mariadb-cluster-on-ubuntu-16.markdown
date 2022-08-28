---
layout: post
title: "Setup a 3 Node Galera MariaDB Cluster on Ubuntu 16"
date: 2017-11-22 18:17:14 -0500
comments: true
categories: ["mariadb", "mysql", "galera", "clustering", "ubuntu"]
---

![](https://i.snag.gy/lpT6Du.jpg)

Today we will setup a 3-Node Galera MariaDB Cluster which is a Multi Master MySQL/MariaDB Cluster on Ubuntu 16.04

## Our Server Details:

```bash
172.31.11.174     mysql-1
172.31.13.206     mysql-2
172.31.6.93       mysql-3
```

## Update Repo Index and Upgrade:

Update the repository indexes and install the needed packages:

```bash
$ sudo apt update && sudo apt upgrade -y
```

Install the needed repository and packages:

```bash
$ apt install software-properties-common -y
$ apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xF1656F24C74CD1D8
$ add-apt-repository 'deb [arch=amd64,i386,ppc64el] http://mirror.lstn.net/mariadb/repo/10.1/ubuntu xenial main'
$ apt update
$ apt install mariadb-server rsync -y
```

## Configuration:

```bash
cat > /etc/mysql/conf.d/galera.cnf << EOF
[mysqld]
binlog_format=ROW
default-storage-engine=innodb
innodb_autoinc_lock_mode=2
bind-address=0.0.0.0

# Galera Provider Configuration
wsrep_on=ON
wsrep_provider=/usr/lib/galera/libgalera_smm.so

# Galera Cluster Configuration
wsrep_cluster_name="my-galera-cluster"
wsrep_cluster_address="gcomm://172.31.11.174,172.31.13.206,172.31.6.93"
# Galera Synchronization Configuration
wsrep_sst_method=rsync

# Galera Node Configuration
wsrep_node_address="172.31.11.174"
wsrep_node_name="mysql-1"
EOF
```

Comment out bind-address, so that MariaDB process is reachable from other nodes, by default it wont be in the config, but just to make sure, if it is uncommented, comment the config:

```bash /etc/mysql/my.cnf
# bind-address = 127.0.0.1
```

Stop the MariaDB Process:

```bash
$ systemctl stop mariadb
```

Note: Repeat the above steps on all 3 nodes.

## Initialize the Cluster:

On the First Node, Initialize the Galera Cluster:

```bash
$ /usr/bin/galera_new_cluster
$ systemctl enable mariadb
```

Check how many nodes are active in the Cluster:

```mysql
$ mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
Enter password:
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 1     |
+--------------------+-------+
```

## Node-2: Start and Enable MariaDB

```bash
$ systemctl start mariadb
$ systemctl enable mariadb
```

Verify that the Node has checked in with the Cluster:

```mysql
$ mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
Enter password:
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 2     |
+--------------------+-------+
```

## Node-3: Start and Enable MariaDB

```bash
$ systemctl start mariadb
$ systemctl enable mariadb
```

Verify that the Node has checked in with the Cluster:

```mysql
$ mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
Enter password:
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 3     |
+--------------------+-------+
```

## Create a Database, Table and Record:

Write some data to the table, then reboot the node, in this example on node-1, then logon to node-2 check the number of nodes that's active in the cluster, which should be 2, then at the same time, look if the data is replicated:

## Node-1: Writing the Data to Our Galera Cluster

```mysql
MariaDB [(none)]> create database test;
MariaDB [(none)]> use test;
MariaDB [test]>   create database test;
MariaDB [test]>   create table foo (name VARCHAR(20));
MariaDB [test]>   insert into foo values('ruan');
MariaDB [test]>   select * from foo;
+------+
| name |
+------+
| ruan |
+------+
```

Now that our data is in our database, reboot the node, logon to node-2 and check if the data is replicated:

```mysql
$ mysql -u root -p
MariaDB [(none)]> use test;
MariaDB [test]>   select * from foo;
+------+
| name |
+------+
| ruan |
+------+
```

While the one node is rebooting, check how many nodes are checked into our cluster:

```mysql
$ mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
Enter password:
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 2     |
+--------------------+-------+
```

Our data is replicated, and after waiting for a couple of seconds, we retry our command to see if the rebooted node checked into the cluster:

```mysql
$ mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
Enter password:
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 3     |
+--------------------+-------+
```

We can confirm that the node that was rebooted, has checked in with the cluster again.

## Firewall Rules opened while testing:

TCP: `3306, 4567, 4568, 4444`
UDP: `4567`


