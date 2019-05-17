---
layout: post
title: "Install Blackbox Exporter to Monitor Websites with Prometheus"
date: 2019-05-17 12:55:15 -0400
comments: true
categories: ["prometheus", "metrics", "monitoring", "blackbox"] 
---

![prometheus](https://user-images.githubusercontent.com/567298/57307750-696bb980-70e5-11e9-9b0b-73ad88bde6a3.png)

Blackbox Exporter by Prometheus allows probing over endpoints such as http, https, icmp, tcp and dns.

## What will we be doing

In this tutorial we will install the blackbox exporter on linux. Im assuming that you have already [set up prometheus](https://blog.ruanbekker.com/blog/2019/05/07/setup-prometheus-and-node-exporter-on-ubuntu-for-epic-monitoring/).

## Install the Blackbox Exporter

First create the blackbox exporter user:

```
$ useradd --no-create-home --shell /bin/false blackbox_exporter
```

Download blackbox exporter and extract:

```
$ wget https://github.com/prometheus/blackbox_exporter/releases/download/v0.14.0/blackbox_exporter-0.14.0.linux-amd64.tar.gz
$ tar -xvf blackbox_exporter-0.14.0.linux-amd64.tar.gz
```

Move the binaries in place and change the ownership:

```
$ cp blackbox_exporter-0.14.0.linux-amd64/blackbox_exporter /usr/local/bin/blackbox_exporter
$ chown blackbox_exporter:blackbox_exporter /usr/local/bin/blackbox_exporter
```

Remove the downloaded archive:

```
$ rm -rf blackbox_exporter-0.14.0.linux-amd64*
```

Create the blackbox directory and create the config:

```
$ mkdir /etc/blackbox_exporter
$ vim /etc/blackbox_exporter/blackbox.yml
```

Populate this config:

```
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: []
      method: GET
```

Update the permissions of the config so that the user has ownership:

```
$ chown blackbox_exporter:blackbox_exporter /etc/blackbox_exporter/blackbox.yml
```

Create the systemd unit file:

```
$ vim /etc/systemd/system/blackbox_exporter.service
```

Populate the systemd unit file configuration:

```
[Unit]
Description=Blackbox Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=blackbox_exporter
Group=blackbox_exporter
Type=simple
ExecStart=/usr/local/bin/blackbox_exporter --config.file /etc/blackbox_exporter/blackbox.yml

[Install]
WantedBy=multi-user.target
```

Reload the systemd daemon and restart the service:

```
$ systemctl daemon-reload
$ systemctl start blackbox_exporter
```

The service should be started, verify:

```
$ systemctl status blackbox_exporter
  blackbox_exporter.service - Blackbox Exporter
   Loaded: loaded (/etc/systemd/system/blackbox_exporter.service; disabled; vendor preset: enabled)
   Active: active (running) since Wed 2019-05-08 00:02:40 UTC; 5s ago
 Main PID: 10084 (blackbox_export)
    Tasks: 6 (limit: 4704)
   CGroup: /system.slice/blackbox_exporter.service
           └─10084 /usr/local/bin/blackbox_exporter --config.file /etc/blackbox_exporter/blackbox.yml

May 08 00:02:40 ip-172-31-41-126 systemd[1]: Started Blackbox Exporter.
May 08 00:02:40 ip-172-31-41-126 blackbox_exporter[10084]: level=info ts=2019-05-08T00:02:40.5229204Z caller=main.go:213 msg="Starting blackbox_exporter" version="(version=0.14.0, branch=HEAD, revision=bb
May 08 00:02:40 ip-172-31-41-126 blackbox_exporter[10084]: level=info ts=2019-05-08T00:02:40.52553523Z caller=main.go:226 msg="Loaded config file"
May 08 00:02:40 ip-172-31-41-126 blackbox_exporter[10084]: level=info ts=2019-05-08T00:02:40.525695324Z caller=main.go:330 msg="Listening on address" address=:9115
```

Enable the service on boot:

```
$ systemctl enable blackbox_exporter
```

## Configure Prometheus

Next, we need to provide context to prometheus on what to monitor. We will inform prometheus to monitor a web endpoint on port 8080 using the blackbox exporter (we will create a python simplehttpserver to run on port 8080).

Edit the prometheus config `/etc/prometheus/prometheus.yml` and append the following:

```
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://localhost:8080
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9115
```

Open a new terminal, create a `index.html`:

```
$ echo "ok" > index.html
```

Then start a SimpleHTTPServer on port 8080:

```
$ python -m SimpleHTTPServer 8080
```

Head back to the previous terminal session and restart prometheus:

```
$ systemctl restart prometheus
```

## Configure the Alarm definition:

Create a alarm definition that desribes that defines when to notify when a endpoint goes down:

```
$ vim /etc/prometheus/alert.rules.yml
```

And our alert definition:

```
groups:
- name: alert.rules
  rules:
  - alert: EndpointDown
    expr: probe_success == 0
    for: 10s
    labels:
      severity: "critical"
    annotations:
      summary: "Endpoint {{ $labels.instance }} down"
```

Ensure that the permission is set:

```
$ chown prometheus:prometheus /etc/prometheus/alert.rules.yml
```

Use the `promtool` to validate that the alert is correctly configured:

```
$ promtool check rules /etc/prometheus/alert.rules.yml
Checking /etc/prometheus/alert.rules.yml
  SUCCESS: 1 rules found
```

If everything is good, restart prometheus:

```
$ systemctl restart prometheus
```

## Blackbox Exporter Dashboard

To install a blackbox exporter dashboard: [https://grafana.com/dashboards/7587](https://grafana.com/dashboards/7587), create a new dashboard, select import, provide the ID: `7587`, select the prometheus datasource and select save.

The dashboard should look similar to this:

![blackbox-exporter](https://user-images.githubusercontent.com/567298/57947217-99357100-78de-11e9-9108-9338c97ca59d.png)

## Next up, Alertmanager

In the [next tutorial](https://blog.ruanbekker.com/blog/2019/05/17/install-alertmanager-to-alert-based-on-metrics-from-prometheus/) we will setup Alertmanager to alert when our endpoint goes down

## Resources

See all [#prometheus](https://blog.ruanbekker.com/blog/categories/prometheus/) blogposts
