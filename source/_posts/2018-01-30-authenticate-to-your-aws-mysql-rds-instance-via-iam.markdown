---
layout: post
title: "Authenticate to your AWS MySQL RDS Instance via IAM"
date: 2018-01-30 10:02:05 -0500
comments: true
categories: ["aws", "mysql", "bash", "rds", "iam"]
---

On Amazon Web Services with RDS for MySQL or Aurora with MySQL compatibility, you can authenticate to your Database instance or cluster using IAM for database authentication. The benefit of using this authentication method is that you don't need to use a password when you connect to your database, but you use your authentication token instead

*Update:*
- [Amazon Supports IAM Authentication for PostgreSQL](https://aws.amazon.com/about-aws/whats-new/2018/09/amazon-rds-postgresql-now-supports-iam-authentication/)

- More info from their [docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.html)

## What we will be doing today:

We will do the following:

- Create RDS MySQL Database
- Create IAM Policy that allows a user to connect via a MySQL User
- Create IAM User and associate IAM Policy
- Configure the new user credentials in the awscli credential provider
- Bash script to generate the auth token and authenticate to RDS via Token instead of password

## Create the RDS Database:

In this tutorial I will spin up a `db.t2.micro` in `eu-west-1` with `IAMDatabaseAuthentication Enabled`:

```bash
aws rds create-db-instance \
    --db-instance-identifier rbtest \
    --db-instance-class db.t2.micro \
    --engine MySQL \
    --allocated-storage 20 \
    --master-username dbadmin \
    --master-user-password mysuperpassword \
    --region eu-west-1 \
    --enable-iam-database-authentication 
```

Give it some time to spin up, then get your database endpoint:

```bash
$ aws rds describe-db-instances --db-instance-identifier rbtest | jq -r ".DBInstances[].Endpoint.Address"
rbtest.abcdefgh.eu-west-1.rds.amazonaws.com
```

If you need to have SSL Enabled, get the bundled certificate as described in the [Using SSL with RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html) docs.

```bash
wget -O /tmp/rds.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
```

## Create the Database Account:

Create the database account on the MySQL RDS instance as described from their [docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.DBAccounts.html). IAM handles the authentication via AWSAuthenticationPlugin, therefore we do not need to set passwords on the database.

Connect to the database:

```bash
$ mysql -u dbadmin -h rbtest.abcdefgh.eu-west-1.rds.amazonaws.com -p
```

Create the database:

```sql
mysql> CREATE USER mydbaccount IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';
mysql> FLUSH PRIVILEGES;
```

## Creating the Databases and Granting Permissions

While you are on the database, create 2 databases (`db1` and `db2`) with some tables, which we will use for our user to have read only access to, and create one database (`db3`) which the user will not have access to: 

```sql
mysql> create database db1;
mysql> create database db2;

mysql> use db1;
mysql> create table foo (name VARCHAR(20), age INT);
mysql> insert into foo values('ruan', 31);
mysql> insert into foo values('james', 32);

mysql> use db2;
mysql> create table foo (location VARCHAR(255));
mysql> insert into foo values('south africa');
mysql> insert into foo values('new zealand');
mysql> insert into foo values('australia');

mysql> grant select on db1.* to 'mydbuser';
mysql> grant select on db2.* to 'mydbuser';

mysql> create database db3;
mysql> use db3;
mysql> create table foo (passwords VARCHAR(255));
mysql> insert into foo values('superpassword');
mysql> insert into foo values('sekret');

mysql> flush privileges;
```

## IAM Permissions to allow our user to authenticate to our RDS. 

First to create the user and configure awscli tools. My default profile has administrative access, so we will create our db user in its own profile and configure our awscli tools with its new access key and secret key:

```bash
$ aws configure --profile dbuser
AWS Access Key ID [None]: xxxxxxxxxxxxx
AWS Secret Access Key [None]: xxxxxxxxxxxxxxxxxx
Default region name [None]: eu-west-1
Default output format [None]: json
```

Now we need to create a IAM policy to allow our user to authenticate to our RDS Instance via IAM, which we will associate with our Users account. 

We need the AWS Account ID, the Database Identifier Resource ID, and the User Account that we created on MySQL.

To get the DB ResourceId:

```bash
$ aws rds describe-db-instances --db-instance-identifier rbtest | jq -r ".DBInstances[].DbiResourceId
db-123456789ABCDEFGH
```

Create the IAM Policy and associate it with the new user account:

- [More info from the Docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html):

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
      	 "Sid": "RDSIAMAUTH",
         "Effect": "Allow",
         "Action": [
             "rds-db:connect"
         ],
         "Resource": [
             "arn:aws:rds-db:eu-west-1:123456789012:dbuser:db-123456789ABCDEFGH/mydbaccount"
         ]
      }
   ]
}
```


The bash script will get the authentication token which will be used as the password. Note that the authentication token will expire after 15 minutes after creation. The [docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.html)

```bash
#!/bin/bash
db_endpoint="rbtest.abcdefgh.eu-west-1.rds.amazonaws.com"
auth_token="$(aws --profile dbuser rds generate-db-auth-token --hostname $RDSHOST --port 3306 --username mydbaccount )"
mysql --host=$db_endpoint --port=3306 --enable-cleartext-plugin --user=mydbaccount --password=$auth_token
```

## Testing it out:

Now that our policies are in place, credentials from the credential provider has been set and our bash script is setup, lets connect to our database:

```bash
./conn-mysql.sh

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| db1                |
| db2                |
+--------------------+
3 rows in set (0.16 sec)

mysql> select * from db2.foo;
+--------------+
| location     |
+--------------+
| south africa |
| new zealand  |
| australia    |
+--------------+

mysql> select * from db3.foo;
ERROR 1044 (42000): Access denied for user 'mydbaccount'@'*' to database 'db3'

mysql> create database test123;
ERROR 1044 (42000): Access denied for user 'mydbaccount'@'%' to database 'test123'
```

Changing the IAM Policy to revoke access:

```bash
./conn-mysql.sh
mysql: [Warning] Using a password on the command line interface can be insecure.
ERROR 1045 (28000): Access denied for user 'mydbaccount'@'10.0.0.10' (using password: YES)
```

## Creating a MySQL Client Wrapper Script:

Using bash we can create a wrapper script so we can connect to our database like the following:

```bash
$ mysql-iam prod rbtest.eu-west-1.amazonaws.com mydbaccount
mysql>
```

Here is the script:

```bash
#!/usr/bin/env bash

# Wrapper MySQL Client for IAM Based Authentication for MySQL and Amazon Aurora on RDS
# Read: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html
# Usage: [app] [aws_profile] [rds_endpoint] [rds_mysql_username]

command_exists() {
  type "$1" &> /dev/null ;
}

check_required_parameters() {
  aws_profile="$1"
  rds_hostname="$2"
  rds_username="$3"
  if ! [[ -n "$aws_profile" && -n "$rds_username" && -n "$rds_username" ]]
    then
      echo "Error: Missing Parameters"
      echo "Expected: $0 aws_profile_name rds_endpoint_name rds_db_username"
      echo "Usage: $0 prod dbname.eu-west-1.amazonaws.com dba"
      exit 1
  fi
}

get_auth_token() {
  aws_bin=$(which aws | head -1)
  auth_token="$($aws_bin --profile $aws_profile rds generate-db-auth-token --hostname $rds_hostname --port 3306 --username $rds_username )"
}

connect_to_rds() {
  mysql_bin=$(which mysql | head -1)
  $mysql_bin --host=$rds_hostname --port=3306 --enable-cleartext-plugin --user=$rds_username --password=$auth_token
}

if [ "$1" == "help" ] 
  then
    echo "Help"
    echo "Expected: $0 aws_profile_name rds_endpoint_name rds_db_username"
    echo "Usage: $0 prod dbname.eu-west-1.amazonaws.com dba_user"
    exit 0
fi

if command_exists aws && command_exists mysql 
then
  check_required_parameters $1 $2 $3
  get_auth_token
  connect_to_rds
else
  echo "Error: Make sure aws-cli and mysql client is installed"
fi
```

For more information on this, have a look at the [docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
