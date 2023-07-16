---
layout: post
title: "How to use the MySQL Terraform Provider"
date: 2023-07-15 20:55:23 -0400
comments: true
categories: ["aws", "terraform", "docker", "devops", "mysql"]
---

In this tutorial we will provision a MySQL Server with Docker and then use Terraform to provision MySQL Users, Database Schemas and MySQL Grants with the MySQL Terraform Provider.

## About

Terraform is super powerful and can do a lot of things. And it shines when it provisions Infrastructure. So in a scenario where we use Terraform to provision RDS MySQL Database Instances, we might still want to provision extra MySQL Users, or Database Schemas and the respective MySQL Grants.

Usually you will logon to the database and create them manually with sql syntax. But in this tutorial we want to make use of Docker to provision our MySQL Server and we would like to make use of Terraform to provision the MySQL Database Schemas, Grants and Users.

Instead of using AWS RDS, I will be provisioning a MySQL Server on Docker so that we can keep the costs free, for those who are following along.

We will also go through the steps on how to rotate the database password that we will be provisioning for our user.

## MySQL Server

First we will provision a MySQL Server on Docker Containers, I have a `docker-compose.yaml` which is available in my [quick-starts](https://github.com/ruanbekker/quick-starts/blob/main/docker/mysql/docker-compose.yaml) github repository:

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    ports:
      - 3306:3306
    environment:
      - MYSQL_DATABASE=sample
      - MYSQL_ROOT_PASSWORD=rootpassword
```

Once you have saved that in your current working directory, you can start the container with docker compose:

```bash
docker-compose up -d
```

You can test the mysql container by logging onto the mysql server with the correct auth:

```bash
docker exec -it mysql mysql -u root -prootpassword -e 'show databases;'
```

This should be more or less the output:

```sql
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sample             |
| sys                |
+--------------------+
```

## Terraform

If you don't have Terraform installed, you can install it from their [documentation](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli). 

If you want the source code of this example, its available in my [terraform-mysql/petoju-provider](https://github.com/ruanbekker/quick-starts/tree/main/terraform/mysql/petoju-provider) repository. Which you can clone and jump into the `terraform/mysql/petoju-provider` directory.

First we will define the `providers.tf`:

```bash
terraform {
  required_providers {
    mysql = {
      source = "petoju/mysql"
      version = "3.0.37"
    }
  }
}

provider "mysql" {
  alias    = "local"
  endpoint = "127.0.0.1:3306"
  username = "root"
  password = "rootpassword"
}
```

Then the `main.tf`:

```bash
resource "random_password" "user_password" {
  length           = 24
  special          = true
  min_special      = 2
  override_special = "!#$%^&*()-_=+[]{}<>:?"
  keepers = {
    password_version = var.password_version
  }
}

resource "mysql_database" "user_db" {
  provider = mysql.local
  name = var.database_name
}

resource "mysql_user" "user_id" {
  provider = mysql.local
  user = var.database_username
  plaintext_password = random_password.user_password.result
  host = "%"
  tls_option = "NONE"
}

resource "mysql_grant" "user_id" {
  provider = mysql.local
  user = var.database_username
  host = "%"
  database = var.database_name
  privileges = ["SELECT", "UPDATE"]
  depends_on = [
    mysql_user.user_id
  ]
}
```

Then the `variables.tf`:

```bash
variable "database_name" {
  description = "The name of the database that you want created."
  type        = string
  default     = null
}

variable "database_username" {
  description = "The name of the database username that you want created."
  type        = string
  default     = null
}

variable "password_version" {
  description = "The password rotates when this value gets updated."
  type        = number
  default     = 0
}
```

Then our `outputs.tf`:

```bash
output "user" {
  value = mysql_user.user_id.user
}

output "password" {
  sensitive = true
  value = random_password.user_password.result
}
```

Our `terraform.tfvars` that defines the values of our variables:

```bash
database_name     = "foobar"
database_username = "ruanb"
password_version  = 0
```

Now we are ready to run our terraform code, which will ultimately create a database, user and grants. Outputs the encrypted string of your password which was encrypted with your `keybase_username`.

Initialise Terraform:

```bash
terraform init
```

Run the plan to see what terraform wants to provision:

```bash
terraform plan
```

And we can see the following resources will be created:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # mysql_database.user_db will be created
  + resource "mysql_database" "user_db" {
      + default_character_set = "utf8mb4"
      + default_collation     = "utf8mb4_general_ci"
      + id                    = (known after apply)
      + name                  = "foobar"
    }

  # mysql_grant.user_id will be created
  + resource "mysql_grant" "user_id" {
      + database   = "foobar"
      + grant      = false
      + host       = "%"
      + id         = (known after apply)
      + privileges = [
          + "SELECT",
          + "UPDATE",
        ]
      + table      = "*"
      + tls_option = "NONE"
      + user       = "ruanb"
    }

  # mysql_user.user_id will be created
  + resource "mysql_user" "user_id" {
      + host               = "%"
      + id                 = (known after apply)
      + plaintext_password = (sensitive value)
      + tls_option         = "NONE"
      + user               = "ruanb"
    }

  # random_password.user_password will be created
  + resource "random_password" "user_password" {
      + bcrypt_hash      = (sensitive value)
      + id               = (known after apply)
      + keepers          = {
          + "password_version" = "0"
        }
      + length           = 24
      + lower            = true
      + min_lower        = 0
      + min_numeric      = 0
      + min_special      = 2
      + min_upper        = 0
      + number           = true
      + numeric          = true
      + override_special = "!#$%^&*()-_=+[]{}<>:?"
      + result           = (sensitive value)
      + special          = true
      + upper            = true
    }

Plan: 4 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + password = (sensitive value)
  + user     = "ruanb"
```

Run the apply which will create the database, the user, sets the password and applies the grants:

```bash
terraform apply
```

Then our returned output should show something like this:

```bash
Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

password = <sensitive>
user = "ruanb"
```

As our password is set as sensitive, we can access the value with `terraform output -raw password`, let's assign the password to a variable: 


```bash
DBPASS=$(terraform output -raw password)
```

Then we can exec into the mysql container and logon to the mysql server with our new credentials:

```bash
docker exec -it mysql mysql -u ruanb -p$DBPASS
```

And we can see we are logged onto the mysql server:

```bash
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 14
Server version: 8.0.33 MySQL Community Server - GPL

mysql>
```

If we run `show databases;` we should see the following:

```sql
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| foobar             |
| information_schema |
| performance_schema |
+--------------------+
3 rows in set (0.03 sec)
```

If we want to rotate the mysql password for the user, we can update the `password_version` variable either in our `terraform.tfvars` or via the cli. Let's pass the variable in the cli and do a `terraform plan` to verify the changes:

```bash
terraform plan -var password_version=1
```

And due to our value for the random resource keepers parameter being updated, it will trigger the value of our password to be changed, and that will let terraform update our mysql user's password:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  ~ update in-place
-/+ destroy and then create replacement

Terraform will perform the following actions:

  # mysql_user.user_id will be updated in-place
  ~ resource "mysql_user" "user_id" {
        id                 = "ruanb@%"
      ~ plaintext_password = (sensitive value)
        # (5 unchanged attributes hidden)
    }

  # random_password.user_password must be replaced
-/+ resource "random_password" "user_password" {
      ~ bcrypt_hash      = (sensitive value)
      ~ id               = "none" -> (known after apply)
      ~ keepers          = { # forces replacement
          ~ "password_version" = "0" -> "1"
        }
      ~ result           = (sensitive value)
        # (11 unchanged attributes hidden)
    }

Plan: 1 to add, 1 to change, 1 to destroy.
```

Let's go ahead by updating our password:

```bash
terraform apply -var password_version=1 -auto-approve
```

To validate that the password has changed, we can try to logon to mysql by using the password variable that was created initially:

```bash
docker exec -it mysql mysql -u ruanb -p$DBPASS
```

And as you can see authentication failed:

```bash
mysql: [Warning] Using a password on the command line interface can be insecure.
ERROR 1045 (28000): Access denied for user 'ruanb'@'localhost' (using password: YES)
```

Set the new password to the variable again:

```bash
DBPASS=$(terraform output -raw password)
```

Then try to logon again:

```bash
docker exec -it mysql mysql -u ruanb -p$DBPASS
```

And we can see we are logged on again:

```bash
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 22
Server version: 8.0.33 MySQL Community Server - GPL

mysql>
```

## Resources

The terraform mysql provider:
- https://registry.terraform.io/providers/petoju/mysql/latest/docs

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

