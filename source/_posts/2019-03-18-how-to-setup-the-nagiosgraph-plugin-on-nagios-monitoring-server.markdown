---
layout: post
title: "How to Setup the NagiosGraph Plugin on Nagios Monitoring Server"
date: 2019-03-18 12:27:11 -0400
comments: true
categories: ["nagios", "monitoring", "graphs"]
---

![](https://user-images.githubusercontent.com/567298/54547916-65f26680-49af-11e9-8d42-e27c57ef8e2e.png)

If you have not setup the [Nagios Server](https://blog.ruanbekker.com/blog/2019/03/13/how-to-setup-a-nagios-monitoring-server/) have a look at that link to setup the Nagios server.

## NagiosGraph

In this post we will setup the nagiosgraph plugin to graph performance data of our monitored host and services.

## Download and Install

Download the nagiosgraph plugin and extract:

```
$ wget 'https://downloads.sourceforge.net/project/nagiosgraph/nagiosgraph/1.5.2/nagiosgraph-1.5.2.tar.gz' -O nagiosgraph-1.5.2.tar.gz
$ tar -xvf nagiosgraph-1.5.2.tar.gz
```

Install dependencies and install the nagiosgraph plugin:

```
$ apt install libnet-snmp-perl libsensors4 libsnmp-base libtalloc2 libtdb1 libwbclient0  snmp whois mrtg  libcgi-pm-perl librrds-perl libgd-perl libnagios-object-perl nagios-plugins-contrib
$ ./install.pl --check-prereq
$ ./install.pl --layout standalone --prefix /usr/local/nagiosgraph


Destination directory (prefix)? [/usr/local/nagiosgraph]
Location of configuration files (etc-dir)? [/usr/local/nagiosgraph/etc]
Location of executables? [/usr/local/nagiosgraph/bin]
Location of CGI scripts? [/usr/local/nagiosgraph/cgi]
Location of documentation (doc-dir)? [/usr/local/nagiosgraph/doc]
Location of examples? [/usr/local/nagiosgraph/examples]
Location of CSS and JavaScript files? [/usr/local/nagiosgraph/share]
Location of utilities? [/usr/local/nagiosgraph/util]
Location of state files (var-dir)? [/usr/local/nagiosgraph/var]
Location of RRD files? [/usr/local/nagiosgraph/var/rrd]
Location of log files (log-dir)? [/usr/local/nagiosgraph/var/log]
Path of log file? [/usr/local/nagiosgraph/var/log/nagiosgraph.log]
Path of CGI log file? [/usr/local/nagiosgraph/var/log/nagiosgraph-cgi.log]
Base URL? [/nagiosgraph]
URL of CGI scripts? [/nagiosgraph/cgi-bin]
URL of CSS file? [/nagiosgraph/nagiosgraph.css]
URL of JavaScript file? [/nagiosgraph/nagiosgraph.js]
URL of Nagios CGI scripts? [/nagios/cgi-bin]
Path of Nagios performance data file? [/tmp/perfdata.log]
username or userid of Nagios user? [nagios]
username or userid of web server user? [www-data]
Modify the Nagios configuration? [n] y
Path of Nagios configuration file? [/usr/local/nagios/etc/nagios.cfg]
Path of Nagios commands file? [/usr/local/nagios/etc/objects/commands.cfg]
Modify the Apache configuration? [n] y
Path of Apache configuration directory? /etc/apache2/sites-enabled

```

Ensure that your nagiosgraph configuration under apache: `/etc/apache2/sites-enabled/nagiosgraph.conf` has the following config (might be standard)


![](https://user-images.githubusercontent.com/567298/54547000-946f4200-49ad-11e9-933e-b0e8b19bf014.png)

Ensure the following configuration is set under nagios main config:

```
$ vi /usr/local/nagios/etc/nagios.cfg

process_performance_data=1 
service_perfdata_file=/usr/local/nagios/var/service-perfdata.log 
service_perfdata_file_template=$LASTSERVICECHECK$||$HOSTNAME$||$SERVICEDESC$||$SERVICEOUTPUT$||$SERVICEPERFDATA$ 
service_perfdata_file_mode=a 
service_perfdata_file_processing_interval=30 
service_perfdata_file_processing_command=process-service-perfdata-for-nagiosgraph
```

Ensure that we have the following commands in place for nagiosgraph:

```
$ vi /usr/local/nagios/etc/objects/commands.cfg

define command {
  command_name process-service-perfdata-for-nagiosgraph
  command_line /usr/local/nagiosgraph/bin/insert.pl
}
```

Create the template `graphed-service`, this will be mapped to each service that needs to be graphed in nagiosgraph:

```
$ vi /usr/local/nagios/etc/objects/templates.cfg

define service {
      name              graphed-service
      action_url        /nagiosgraph/cgi-bin/show.cgi?host=$HOSTNAME$&service=$SERVICEDESC$' onMouseOver='showGraphPopup(this)' onMouseOut='hideGraphPopup()' rel='/nagiosgraph/cgi-bin/showgraph.cgi?host=$HOSTNAME$&service=$SERVICEDESC$&period=week&rrdopts=-w+450+-j
      register        0
      }
```

Next configure the services that needs to be graphed on nagios graph. Note, we only need to append the service template that we defined in our template configuration from above:

Note, if you have not checked out [Nagios Server Setup](https://blog.ruanbekker.com/blog/2019/03/13/how-to-setup-a-nagios-monitoring-server/) post, in that post the inital configuration of the below config is explained.

```
$ vi /usr/local/nagios/etc/servers/vpn.cfg

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

define service {
    use                    generic-service,graphed-service
    host_name              WEB01
    service_description    PING
    check_command          check_ping!100.0,20%!500.0,60%
}

define service {
    use                      generic-service,graphed-service
    host_name                WEB01
    service_description      SSH
    check_command            check_ssh
    notifications_enabled    1
}

define service {
    use                      generic-service,graphed-service
    host_name                WEB01
    service_description      HTTP
    check_command            check_http
    notifications_enabled    1
}

```

Test the nagios config and restart if there are no warnings:

```
$ /usr/local/nagios/bin/nagios -v /usr/local/nagios/etc/nagios.cfg
$ systemctl restart nagios
$ systemctl restart apache2
```

Access your nagios server at http://nagios-ip/nagios and you will find that the graph icon next to the service will open the graph in a new tab, like the screenshot below:

![](https://user-images.githubusercontent.com/567298/54546912-5d992c00-49ad-11e9-8a7a-331578d20f5b.png)

## Up Next

Next, [Monitor your first Server with Nagios](https://blog.ruanbekker.com/blog/2019/03/18/monitor-your-first-host-and-services-with-nagios/)
