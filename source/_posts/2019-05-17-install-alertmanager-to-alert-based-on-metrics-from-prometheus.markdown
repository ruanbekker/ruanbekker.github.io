---
layout: post
title: "Install Alertmanager to Alert based on Metrics from Prometheus"
date: 2019-05-17 12:49:26 -0400
comments: true
categories: ["alertmanager", "prometheus", "notifications", "monitoring", "metrics"] 
---
![prometheus](https://user-images.githubusercontent.com/567298/57307750-696bb980-70e5-11e9-9b0b-73ad88bde6a3.png)

So we are pushing our time series metrics into prometheus, and now we would like to alarm based on certain metric dimensions. That's where alertmanager fits in. We can setup targets and rules, once rules for our targets does not match, we can alarm to destinations suchs as slack, email etc.

<a href="https://github.com/ruanbekker/cheatsheets" target="_blank"><img alt="ruanbekker-cheatsheets" src="https://user-images.githubusercontent.com/567298/169162832-ef3019de-bc49-4d6c-b2a6-8ac17c457d24.png"></a>

## What we will be doing:

In our previous tutorial we installed blackbox exporter to probe a endpoint. Now we will install Alertmanager and configure an alert to notify us via email and slack when our endpoint goes down. See [this post](https://blog.ruanbekker.com/blog/2019/05/17/install-blackbox-exporter-to-monitor-websites-with-prometheus/) if you have not seen the previous tutorial.

## Install Alertmanager

Create the user for alertmanager:

```
$ useradd --no-create-home --shell /bin/false alertmanager
```

Download alertmanager and extract:

```
$ https://github.com/prometheus/alertmanager/releases/download/v0.17.0/alertmanager-0.17.0.linux-amd64.tar.gz
$ tar -xvf alertmanager-0.17.0.linux-amd64.tar.gz
```

Move alertmanager and amtool birnaries in place:

```
$ cp alertmanager-0.17.0.linux-amd64/alertmanager /usr/local/bin/
$ cp alertmanager-0.17.0.linux-amd64/amtool /usr/local/bin/
```

Ensure that the correct permissions are in place:

```
$ chown alertmanager:alertmanager /usr/local/bin/alertmanager
$ chown alertmanager:alertmanager /usr/local/bin/amtool
```

Cleanup:

```
$ rm -rf alertmanager-0.17.0*
```

## Configure Alertmanager:

Create the alertmanager directory and configure the global alertmanager configuration:

```
$ mkdir /etc/alertmanager
$ vim /etc/alertmanager/alertmanager.yml
```

Provide the global config and ensure to populate your personal information. See [this post](https://blog.ruanbekker.com/blog/2019/04/18/setup-a-slack-webhook-for-sending-messages-from-applications/) to create a slack webhook.

```
global:
  smtp_smarthost: 'smtp.domain.net:587'
  smtp_from: 'AlertManager <mailer@domain.com>'
  smtp_require_tls: true
  smtp_hello: 'alertmanager'
  smtp_auth_username: 'username'
  smtp_auth_password: 'password'

  slack_api_url: 'https://hooks.slack.com/services/x/xx/xxx'

route:
  group_by: ['instance', 'alert']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h
  receiver: team-1

receivers:
  - name: 'team-1'
    email_configs:
      - to: 'user@domain.com'
    slack_configs:
      # https://prometheus.io/docs/alerting/configuration/#slack_config
      - channel: 'system_events'
      - username: 'AlertManager'
      - icon_emoji: ':joy:'
```

Ensure the permissions are in place:

```
$ chown alertmanager:alertmanager -R /etc/alertmanager
```

Create the alertmanager systemd unit file:

```
$ vim /etc/systemd/system/alertmanager.service
```

And supply the unit file configuration. Note that I am exposing port `9093` directly as Im not using a reverse proxy.

```
[Unit]
Description=Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
WorkingDirectory=/etc/alertmanager/
ExecStart=/usr/local/bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml --web.external-url http://0.0.0.0:9093

[Install]
WantedBy=multi-user.target
```

Now we need to inform prometheus that we will send alerts to alertmanager to it's exposed port:

```
$ vim /etc/prometheus/prometheus.yml
```

And supply the alertmanager configuration for prometheus:

```
...
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - localhost:9093
...
```

So when we get alerted, our alert will include a link to our alert. We need to provide the base url of that alert. That get's done in our alertmanager systemd unit file: `/etc/systemd/system/alertmanager.service` under `--web.external-url` passing the alertmanager base ip address:

```
[Unit]
Description=Alertmanager
Wants=network-online.target
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
WorkingDirectory=/etc/alertmanager/
ExecStart=/usr/local/bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml --web.external-url http://<your.alertmanager.ip.address>:9093

[Install]
WantedBy=multi-user.target
```

Then we need to do the same with the prometheus systemd unit file: `/etc/systemd/system/prometheus.service` under `--web.external-url` passing the prometheus base ip address:

```
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.external-url http://<your.prometheus.ip.address>

[Install]
WantedBy=multi-user.target
```

Since we have edited the systemd unit files, we need to reload the systemd daemon:

```
$ systemctl daemon-reload
```

Then restart prometheus and alertmanager:

```
$ systemctl restart prometheus
$ systemctl restart alertmanager
```

Inspect the status of alertmanager and prometheus:

```
$ systemctl status alertmanager
$ systemctl status prometheus
```

If everything seems good, enable alertmanager on boot:

```
$ systemctl enable alertmanager
```

## Access Alertmanager:

Access alertmanager on your endpoint on port `9093`:

![alertmanager](https://user-images.githubusercontent.com/567298/57946361-69856980-78dc-11e9-8c48-ebcc3b0d201e.png)

From our previous tutorial we started a local web service on port `8080` that is being monitored by prometheus. Let's stop that service to test out the alerting. You should get a notification via email:

![alertmanager](https://user-images.githubusercontent.com/567298/57946586-f29ca080-78dc-11e9-983c-6b857ef21bae.png)

And the notification via slack:

![alertmanager](https://user-images.githubusercontent.com/567298/57946602-03e5ad00-78dd-11e9-9ecc-c3d58b2ad3ec.png)

When you start the service again and head over to the prometheus ui under alerts, you will see that the service recovered:

![prometheus](https://user-images.githubusercontent.com/567298/57946647-2677c600-78dd-11e9-95a9-b9f4190172bf.png)

## Install Prometheus Alertmanager Plugin

Install the Prometheus Alertmanager Plugin in Grafana. Head to the instance where grafana is installed and install the plugin:

```
$ grafana-cli plugins install camptocamp-prometheus-alertmanager-datasource
```

Once the plugin is installed, restart grafana:

```
$ service grafana-server restart
```

Install the dasboard [grafana.com/dashboards/8010](https://grafana.com/dashboards/8010). Create a new datasource, select the prometheus-alertmanager datasource, configure and save. 

Add a new dasboard, select import and provide the ID `8010`, select the prometheus-alertmanager datasource and save. You should see the following (more or less):

![prometheus-alertmanager](https://user-images.githubusercontent.com/567298/57947092-3f34ab80-78de-11e9-904b-f42d5ecd7d0a.png)

## Resources

See all [#prometheus](https://blog.ruanbekker.com/blog/categories/prometheus/) blogposts
