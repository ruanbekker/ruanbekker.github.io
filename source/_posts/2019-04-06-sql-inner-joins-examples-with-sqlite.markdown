---
layout: post
title: "SQL Inner Joins Examples with SQLite"
date: 2019-04-06 15:47:38 -0400
comments: true
categories: ["sql", "sqlite", "databases"]
---

![sqlite](https://user-images.githubusercontent.com/567298/55704774-53cb7d00-59dd-11e9-9f43-65ec3aa857b5.png)

## Overview

In this tutorial we will get started with sqlite and use inner joins to query data from multiple tables to answer specific use case needs.

## Connecting to your Sqlite Database

Connecting to your database uses the argument to the target database. You can use additional flags to set the properties that you want to enable:

```sql
$ sqlite3 -header -column mydatabase.db
```

or you can specify the additional options to your config:

```bash
cat > ~/.sqliterc << EOF
.mode column
.headers on
EOF
```

Then connecting to your database:

```bash
$ sqlite3 mydatabase.db
-- Loading resources from /Users/ruan/.sqliterc
SQLite version 3.16.0 2016-11-04 19:09:39
Enter ".help" for usage hints.
sqlite>
```

## Create the Tables

Create the `users` table:

```sql
sqlite> create table users (
   ...> id INT(20), name VARCHAR(20), surname VARCHAR(20), city VARCHAR(20),
   ...> age INT(2), credit_card_num VARCHAR(20), job_position VARCHAR(20)
   ...> );
```

Create the `transactions` table:

```sql
sqlite> create table transactions (
   ...> credit_card_num VARCHAR(20), transaction_id INT(20), shop_name VARCHAR(20),
   ...> product_name VARCHAR(20), spent_total DECIMAL(6,2), purchase_option VARCHAR(20)
   ...> );
```

You can view the tables using `.tables`:

```sql
sqlite> .tables
transactions  users 
```

And view the schema of the tables using `.schema <table-name>`

```sql
sqlite> .schema users
CREATE TABLE users (
id INT(20), name VARCHAR(20), surname VARCHAR(20), city VARCHAR(20),
age INT(2), credit_card_num VARCHAR(20), job_position VARCHAR(20)
);
```

## Write to Sqlite Database

Now we will populate data to our tables. Insert a record to our users table:

```sql
sqlite> insert into users values(1, 'ruan', 'bekker', 'cape town', 31, '2345-8970-6712-4352', 'devops');
```

Insert a record to our transactions table:

```sql
sqlite> insert into transactions values('2345-8970-6712-4352', 981623, 'spaza01', 'burger', 101.02, 'credit_card');
```

## Read from the Sqlite Database

Read the data from the users table:

```sql
sqlite> select * from users;
id          name        surname     city        age         credit_card_num      job_position
----------  ----------  ----------  ----------  ----------  -------------------  ------------
1           ruan        bekker      cape town   31          2345-8970-6712-4352  devops      
```

Read the data from the transactions table:

```sql
sqlite> select * from transactions;
credit_card_num      transaction_id  shop_name   product_name  spent_total  purchase_option
-------------------  --------------  ----------  ------------  -----------  ---------------
2345-8970-6712-4352  981623          spaza01     burger        101.02       credit_card    
```

## Inner Joins with Sqlite

This is where stuff gets interesting. 

Let's say you want to join data from 2 tables, in this example we have a table with our userdata and a table with transaction data. 

Say we want to see the user's name, transaction id, the product they purchased and the total amount spent, we will make use of inner joins. 

Example looks like this:

```sql
sqlite> select a.name, b.transaction_id, b.product_name, b.spent_total
   ...> from users
   ...> as a inner join transactions
   ...> as b on a.credit_card_num = b.credit_card_num
   ...> where a.credit_card_num = '2345-8970-6712-4352';
name        transaction_id  product_name  spent_total
----------  --------------  ------------  -----------
ruan        981623          burger         101.02  
```

Let's say you dont know the credit_card number but you would like to do a lookup the credit card number via the user's id, then pass the value to the where statement:

```sql
sqlite> select a.name, b.transaction_id, b.product_name, b.spent_total
   ...> from users
   ...> as a inner join transactions
   ...> as b on a.credit_card_num = b.credit_card_num
   ...> where a.credit_card_num = (select credit_card_num from users where id = 1);
name        transaction_id  product_name  spent_total
----------  --------------  ------------  -----------
ruan        981623          burger         101.02   
```

Let's create another table called `products`:

```sql
sqlite> create table products (
   ...> product_id INTEGER(18), product_name VARCHAR(20), 
   ...> product_category VARCHAR(20), product_price DECIMAL(6,2)
   ...> );
```

Write a record with product data to the table:

```sql
sqlite> insert into products values(0231, 'burger', 'fast foods', 101.02);
```

Now, lets say the question will be that we need to display the users name, credit card number, product name as well as the product category and products price, by only giving you the credit card number

```sql
sqlite> select a.name, b.credit_card_num, c.product_name, c.product_category, c.product_price
   ...> from users
   ...> as a inner join transactions
   ...> as b on a.credit_card_num = b.credit_card_num inner join products
   ...> as c on b.product_name = c.product_name
   ...> where a.credit_card_num = '2345-8970-6712-4352' and c.product_name = 'burger';
name        credit_card_num      product_name  product_category   product_price
----------  -------------------  ------------  -----------------  -------------
ruan        2345-8970-6712-4352  burger        fast foods         101.02   
```
