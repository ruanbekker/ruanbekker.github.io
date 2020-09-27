---
layout: post
title: "Using the local-exec provisioner with Terraform"
date: 2020-09-27 17:08:49 +0000
comments: true
categories: ["terraform", "devops"]
---

This is a basic example on how to use the `local-exec` provisioner in terraform, and I will use it to write a environment variable's value to disk.

## Installing Terraform

Get the latest version of [terraform](https://www.terraform.io/downloads.html), for this post, I will be using the latest version of the time of writing:

```
$ wget https://releases.hashicorp.com/terraform/0.13.3/terraform_0.13.3_linux_amd64.zip
$ unzip terraform_0.13.3_linux_amd64.zip
$ sudo mv terraform /usr/local/bin/terraform
```

Ensure that it's working:

```
$ terraform -version
Terraform v0.13.3
```

## Terraform local-exec

The local-exec provisioner allows us to run a command locally, so to test that we will write the environment variable `owner=ruan` to disk. 

First setup our `main.tf`:

```
resource "null_resource" "this" {
  provisioner "local-exec" {
    command = "echo ${var.owner} > file_${null_resource.this.id}.txt"
  }
}
```

As you can see our `local-exec` provisioner is issuing the command echo to write the environment variable `owner`'s value to a file on disk, and the file name is `file_` + the null resource's id.

As we are referencing a variable, we need to define the variable, I will define it in `variables.tf`:

```
variable "owner" {}
```

As you can see, I am not defining the value, as I will define the value at runtime. 

## Initialize

When we initialize terraform, terraform builds up a dependency tree from all the `.tf` files and downloads any dependencies it requires:

```
$ terraform init
```

## Apply

Run our deployment and pass our variable at runtime:

```
$ terraform apply -var 'owner=ruan' -auto-approve

null_resource.this: Creating...
null_resource.this: Provisioning with 'local-exec'...
null_resource.this (local-exec): Executing: ["/bin/sh" "-c" "echo ruan > file_4397943546484635522.txt"]
null_resource.this: Creation complete after 0s [id=4397943546484635522]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

View the written file:

```
$ cat file_4397943546484635522.txt
ruan
```

If we wanted to define the environment variable in the `variables.tf` file, it will look like this:

```
variable "owner" {
  description = "the owner of this project"
  default     = "ruan"
}
```

The github repository for this code is located at:

- https://github.com/ruanbekker/terraformfiles/tree/master/variable-via-cli
