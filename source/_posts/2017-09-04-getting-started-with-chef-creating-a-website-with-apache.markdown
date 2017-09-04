---
layout: post
title: "Getting Started with Chef: Creating a Website with Apache"
date: 2017-09-04 14:21:20 -0400
comments: true
categories: ["chef", "devops"] 
---

From my previous post we got started with [Installing the Chef Devlopment Kit](http://blog.ruanbekker.com/blog/2017/09/04/getting-started-with-chef-working-with-files/) and using the file resource type.

In this post we will create a recipe that will:

- Update the APT Cache
- Install the Apache2 package
- Enables and Starts Apache2 on Boot
- Create a index.html for our Website

## Creating a Web Server:

We will create our `webserver.rb` recipe, and our first section will consist of the following:

- Ensuring our APT Cache is up to date
- The Frequency property indiciates 24 hours
- The periodic action indicates that the update occurs periodically
- Optional: the `:update` action will update the apt cache on each run
- Installs the apache2 package (No action is specified, defaults to `:install`)

```ruby
apt_update 'Update APT Cache Daily' do
  frequency 86_400
  action :periodic
end

package 'apache2'
```

Running this recipe at this moment will provide the following output:

```bash
$ chef-client --local-mode webserver.rb
..
Converging 2 resources
Recipe: @recipe_files::/root/chef-repo/webserver.rb
  * apt_update[Update APT Cache Daily] action periodic
    - update new lists of packages
    * directory[/var/lib/apt/periodic] action create (up to date)
    * directory[/etc/apt/apt.conf.d] action create (up to date)
    * file[/etc/apt/apt.conf.d/15update-stamp] action create_if_missing
      - create new file /etc/apt/apt.conf.d/15update-stamp
      - update content in file /etc/apt/apt.conf.d/15update-stamp from none to 174cdb
      --- /etc/apt/apt.conf.d/15update-stamp    2017-09-04 16:53:31.604488306 +0000
      +++ /etc/apt/apt.conf.d/.chef-15update-stamp20170904-5727-1p2g8zw 2017-09-04 16:53:31.604488306 +0000
      @@ -1 +1,2 @@
      +APT::Update::Post-Invoke-Success {"touch /var/lib/apt/periodic/update-success-stamp 2>/dev/null || true";};
    * execute[apt-get -q update] action run
      - execute apt-get -q update
```

Next, we will set `apache2` to start on boot and start the service:

```ruby
apt_update 'Update APT Cache Daily' do
  frequency 86_400
  action :periodic
end

package 'apache2'

service 'apache2' do
  supports status: true
  action [:enable, :start]
end
```

Running our chef client, will produce the following output:

```bash
$ chef-client --local-mode webserver.rb
Converging 3 resources
Recipe: @recipe_files::/root/chef-repo/webserver.rb
  * apt_update[Update APT Cache Daily] action periodic (up to date)
  * apt_package[apache2] action install (up to date)
  * service[apache2] action enable (up to date)
  * service[apache2] action start
    - start service service[apache2]
```

Verifying that our apache2 service is started:

```bash
$ /etc/init.d/apache2 status
 * apache2 is running
```

Next, using the file resource, we will replace the `/var/www/html/index.html' landing page with the one that we will specify in our recipe:

```ruby
apt_update 'Update APT Cache Daily' do
  frequency 86_400
  action :periodic
end

package 'apache2'

service 'apache2' do
  supports status: true
  action [:enable, :start]
end

file '/var/www/html/index.html' do
  content '<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>'
end
```

And our full `webserver.rb` recipe will look like the following:

```ruby
# update cache periodically every 24 hours
apt_update 'Update APT Cache Daily' do
  frequency 86_400
  action :periodic
end

# install apache2 (:install is the default action)
package 'apache2'

# enable apache2 on boot and start apache2
service 'apache2' do
  supports status: true
  action [:enable, :start]
end

# create a custom html page
file '/var/www/html/index.html' do
  content '<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>'
end
```

## Running our Chef Client against our Recipe:

For the previous snippets, we took it section by section, here we will run the whole recipe:

```bash
$ chef-client --local-mode webserver.rb
...
Converging 4 resources
Recipe: @recipe_files::/root/chef-repo/webserver.rb
  * apt_update[Update APT Cache Daily] action periodic (up to date)
  * apt_package[apache2] action install (up to date)
  * service[apache2] action enable (up to date)
  * service[apache2] action start (up to date)
  * file[/var/www/html/index.html] action create
    - update content in file /var/www/html/index.html from 538f31 to 9d1dca
    --- /var/www/html/index.html        2017-09-04 16:53:55.134043652 +0000
    +++ /var/www/html/.chef-index20170904-7451-3kt1p7.html      2017-09-04 17:00:16.306831840 +0000
```

## Testing our Website:

And finally, testing our website:

```bash
$ curl -XGET http://localhost/
<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>
```

## Resources:

- https://docs.chef.io/resource_file.html
- https://docs.chef.io/recipes.html
- https://learn.chef.io

