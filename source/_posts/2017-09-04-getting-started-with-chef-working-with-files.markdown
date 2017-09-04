---
layout: post
title: "Getting Started with Chef: Working with Files"
date: 2017-09-04 14:06:01 -0400
comments: true
categories: ["chef", "devops"]
---

Chef: Infrastructure as Code, Automation, Configuration Management, having a service that can do that, and especially having something in place that knows what the desired state of your configurations/applications should be is definitely a plus. 

I stumbled upon [learn.chef.io](https://learn.chef.io) which is a great resource for learning chef, as I am learning Chef at this moment.

The Components of Chef consists of:

- Chef Workstation (ChefDK enables you to use the tools locally to test before pushing your code to the Chef Server)
- Chef Server (Central Repository for your Cookbooks and info of every node Chef Manages)
- Chef Client (a Node that is Managed by the Chef Server)

In this post we will install the Chef Development Kit, and work with the chef-client in local-mode to create, update and delete files using the `file` resource type.

## Getting Started with Chef: Installation:

Installing the Chef Development Kit:

```bash
$ sudo apt-get update && apt-get upgrade -y
$ sudo apt-get install curl git -y
$ curl https://omnitruck.chef.io/install.sh | sudo bash -s -- -P chefdk -c stable -v 2.0.28
```

## Configure a Resource:

Using `chef-client` in local mode, we will use the `resource: file` to create a recipe that will create our `motd` file

```ruby hello.rb
file '/tmp/motd' do
  content 'hello world'
end
```

Running chef client against our recipe in local-mode:

```bash
$ chef-client --local-mode hello.rb
..
Converging 1 resources
Recipe: @recipe_files::/root/chef-repo/hello.rb
  * file[/tmp/motd] action create
    - create new file /tmp/motd
    - update content in file /tmp/motd from none to b94d27
    --- /tmp/motd       2017-09-04 16:18:19.265699403 +0000
    +++ /tmp/.chef-motd20170904-4500-54fh8w     2017-09-04 16:18:19.265699403 +0000
    @@ -1 +1,2 @@
    +hello world
```

Verify the Content:

```bash
$ cat /tmp/motd
hello world
```

Running the command again will do nothing, as the content is in its desired state:

```bash
$ chef-client --local-mode hello.rb
..
Converging 1 resources
Recipe: @recipe_files::/root/chef-repo/hello.rb
  * file[/tmp/motd] action create (up to date)
```

Changing our recipe by replacing the word `world` with `chef`, we will find that the content of our file will be updated:

```bash
$ chef-client --local-mode hello.rb
..
Converging 1 resources
Recipe: @recipe_files::/root/chef-repo/hello.rb
  * file[/tmp/motd] action create
    - update content in file /tmp/motd from b94d27 to c38c60
    --- /tmp/motd       2017-09-04 16:18:19.265699403 +0000
    +++ /tmp/.chef-motd20170904-4903-wuigr      2017-09-04 16:23:21.379649145 +0000
    @@ -1,2 +1,2 @@
    -hello world
    +hello chef
```

Let's overwrite the content of our `motd` file manually:

```bash
$ echo 'hello robots' > /tmp/motd
```

Running Chef Client against our recipe again, allows Chef to restore our content to the desired state that is specified in our recipe:

```bash
$ chef-client --local-mode hello.rb
..
Converging 1 resources
Recipe: @recipe_files::/root/chef-repo/hello.rb
  * file[/tmp/motd] action create
    - update content in file /tmp/motd from 548078 to c38c60
    --- /tmp/motd       2017-09-04 16:24:29.308286834 +0000
    +++ /tmp/.chef-motd20170904-5103-z16ssa     2017-09-04 16:24:42.528021632 +0000
    @@ -1,2 +1,2 @@
    -hello robots
    +hello chef
```

Deleting a file from our recipe:

```ruby destroy.rb
file '/tmp/motd' do
  action :delete
end
```

Now using chef client to execute against this file will remove our file:

```bash
$ chef-client --local-mode destroy.rb
Recipe: @recipe_files::/root/chef-repo/destroy.rb
  * file[/tmp/motd] action delete
    - delete file /tmp/motd
```

## Resources:

- https://docs.chef.io/resource_file.html
- https://docs.chef.io/recipes.html
- https://learn.chef.io

