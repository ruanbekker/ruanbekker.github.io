---
layout: post
title: "Monitor your First Host and Services with Nagios"
date: 2019-03-18 12:49:23 -0400
comments: true
categories: ["nagios", "monitoring"]
---

![](https://user-images.githubusercontent.com/567298/54547916-65f26680-49af-11e9-8d42-e27c57ef8e2e.png)

If you have not setup the [Nagios Server](https://blog.ruanbekker.com/blog/2019/03/13/how-to-setup-a-nagios-monitoring-server/) have a look at that link to setup the Nagios server.

## Configure Nagios to Monitor our first Host

I like to setup an isolated path for my custom host/service configigurations. First we will declare the configuration path for our servers.

Open up: `/usr/local/nagios/etc/nagios.cfg` and add a new `cfg_dir`:

```
cfg_dir=/usr/local/nagios/etc/servers
```

Now, create the directory:

```
$ mkdir /usr/local/nagios/etc/servers
```

Configure your email address for notifications in `/usr/local/nagios/etc/objects/contacts.cfg` and configure:

```
email     youremail@yourdomain.com;
```

Let's say we want to configure a web server named web01 that sits at the location 10.10.10.10:


```
$ vi /usr/local/nagios/etc/servers/webservers.cfg
```

First we define our host configuration:

1. We are using the `linux-server` template that is defined in `/usr/local/nagios/etc/objects/templates.cfg`
2. We set the hostname, alias and address as well as notification prediods

```
define host {
    use                      linux-server
    host_name                WEB01
    alias                    WEB01
    address                  10.10.10.10
    max_check_attempts       5
    check_period             24x7
    notification_interval    30
    notification_period      24x7
}
```

While you have the config open, we want to define the services that we would like to monitor, and associate the services to the host that we defined.

In this example, we want to ping the server and check port tcp 22 and 80. Ensure that your web server is allowing the mentioned ports from the nagios server ip.

In the config, we are declaring the following:

1. Use the `generic-service` template
2. Map the hostname which the service should be associated to
3. The description that you will see in nagios
4. Use the check_ping / check_ssh / check_http plugin and set the thresholds for ok, warning, critical

```
define service {
    use                    generic-service
    host_name              WEB01
    service_description    PING
    check_command          check_ping!100.0,20%!500.0,60%
}

define service {
    use                      generic-service
    host_name                WEB01
    service_description      SSH
    check_command            check_ssh
    notifications_enabled    1
}

define service {
    use                      generic-service
    host_name                WEB01
    service_description      HTTP
    check_command            check_http
    notifications_enabled    1
}
```

Save the config, test the config:

```
$ /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios
```

If you don't see any errors, go ahead and restart to apply the configs:

```
$ systemctl restart nagios
$ systemctl restart apache2
```

Head over to nagios user interface at http://nagios-ip/nagios and you should see that the services are scheduled to be checked and should be reflecting in a minute or two.

## Up Next

Next up, [Setup the NRPE Server and Client](https://blog.ruanbekker.com/blog/2019/03/18/setup-nrpe-client-and-server-for-monitoring-remote-services-in-nagios/) to monitor remote systems using the nrpe plugin.

