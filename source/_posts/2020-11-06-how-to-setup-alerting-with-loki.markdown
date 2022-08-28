---
layout: post
title: "How to Setup Alerting with Loki"
date: 2020-11-06 15:13:53 +0000
comments: true
categories: ["loki", "alertmanager", "docker", "grafana"] 
---

![image](https://user-images.githubusercontent.com/567298/98380823-bd948880-2051-11eb-8ab4-c8d5f5d3e612.png)

Recently Grafana Labs announced **[Loki v2](https://grafana.com/blog/2020/10/28/loki-2.0-released-transform-logs-as-youre-querying-them-and-set-up-alerts-within-loki/)** and its awesome! Definitely check out their blog post on more details.

Loki has a index option called **boltdb-shipper**, which allows you to run Loki with only a object store and you **no longer need a dedicated index store** such as DynamoDB. You can extract labels from log lines at query time, which is CRAZY! And I really like how they've implemented it, you can parse, filter and format like mad. I really like that.

And then generating alerts from any query, which we will go into today. Definitely check out [this blogpost](https://grafana.com/blog/2020/10/28/loki-2.0-released-transform-logs-as-youre-querying-them-and-set-up-alerts-within-loki/) and [this video](https://grafana.com/blog/2020/11/04/video-top-three-features-of-the-new-loki-2.0/) for more details on the features of Loki v2.

## What will we be doing today

In this tutorial we will setup a alert using the Loki local ruler to alert us when we have **high number of log events coming in**. For example, let's say someone has debug logging enabled in their application and we want to send a alert to slack when it breaches the threshold.

I will simulate this with a `http-client` container which runs `curl` in a while loop to fire a bunch of http requests against the nginx container which logs to Loki, so we can see how the alerting works, and in this scenario we will alert to Slack. 

And after that we will stop our http-client container to see how the alarm resolves when the log rate comes down again.

All the components are available in the `docker-compose.yml` on my [github repository](https://github.com/ruanbekker/loki-alerts-docker)

## Components

Let's break it down and start with the loki config:

```
...
ruler:
  storage:
    type: local
    local:
      directory: /etc/loki/rules
  rule_path: /tmp/loki/rules-temp
  alertmanager_url: http://alertmanager:9093
  ring:
    kvstore:
      store: inmemory
  enable_api: true
  enable_alertmanager_v2: true
```

In the section of the loki config, I will be making use of the local ruler and map my alert rules under `/etc/loki/rules/` and we are also defining our alertmanager instance where these alerts should be shipped to.

In my rule definition `/etc/loki/rules/demo/rules.yml`:

```
groups:
  - name: rate-alerting
    rules:
      - alert: HighLogRate
        expr: |
          sum by (compose_service)
            (rate({job="dockerlogs"}[1m]))
            > 60
        for: 1m
        labels:
            severity: warning
            team: devops
            category: logs
        annotations:
            title: "High LogRate Alert"
            description: "something is logging a lot"
            impact: "impact"
            action: "action"
            dashboard: "https://grafana.com/service-dashboard"
            runbook: "https://wiki.com"
            logurl: "https://grafana.com/log-explorer"
```

In my expression, I am using LogQL to return per second rate of all my docker logs within the last minute per compose service for my dockerlogs job and we are specifying that it should alert when the threshold is above 60.

As you can see I have a couple of **labels and annotations**, which becomes **very useful** when you have dashboard links, runbooks etc and you would like to map that to your alert. I am doing the mapping in my `alertmanager.yml` config:

```
route:
...
  receiver: 'default-catchall-slack'
  routes:
  - match:
      severity: warning
    receiver: warning-devops-slack
    routes:
    - match_re:
        team: .*(devops).*
      receiver: warning-devops-slack

receivers:
...
- name: 'warning-devops-slack'
  slack_configs:
    - send_resolved: true
      channel: '__SLACK_CHANNEL__'
      title: '{{ if eq .Status "firing" }}:fire:{{ else }}:white_check_mark:{{ end }} [{{ .Status | toUpper }}] {{ .CommonAnnotations.title }} '
      text: >-
        {{ range .Alerts }}
          *Description:* {{ .Annotations.description }}
          *Severity:* `{{ .Labels.severity }}`
          *Graph:* {{ if eq .Labels.category "logs" }}<{{ .Annotations.logurl }}|:chart_with_upwards_trend:>{{ else }}<{{ .GeneratorURL }}|:chart_with_upwards_trend:>{{ end }} *Dashboard:* <{{ .Annotations.dashboard }}|:bar_chart:> *Runbook:* <{{ .Annotations.runbook }}|:spiral_note_pad:>
          *Details:*
          {{ range .Labels.SortedPairs }} - *{{ .Name }}:* `{{ .Value }}`
          {{ end }}
           - *Impact*: {{ .Annotations.impact }}
           - *Receiver*: warning-{{ .Labels.team }}-slack
        {{ end }}
```

As you can see, when my alert matches nothing it will go to my catchall receiver, but when my label contains `devops` and the route the alert to my `warning-devops-slack` receiver, and then we will be parsing our labels and annotations to include the values in our alarm on slack.

## Demo

Enough with the background details, and it's time to get into the action.

All the code for this demonstration will be available in my github repository: **[github.com/ruanbekker/loki-alerts-docker](https://github.com/ruanbekker/loki-alerts-docker)**

The docker-compose will have a container of **grafana**, **alertmanager**, **loki**, **nginx** and a **http-client**.

The http-client is curl in a while loop that will just make a bunch of http requests against the nginx container, which will be logging to loki.

## Get the source

Get the code from my github repository:

```
$ git clone https://github.com/ruanbekker/loki-alerts-docker
$ cd loki-alerts-docker
```

You will need to replace the slack webhook url and the slack channel where you want your alerts to be sent to. This will take the environment variables and replace the values in `config/alertmanager.yml` (always check out the script first, before executing it)

```
$ SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xx/xx/xx" SLACK_CHANNEL="#notifications" ./parse_configs.sh
```

You can double check by running `cat config/alertmanager.yml`, once you are done, boot the stack:

```
$ docker-compose up -d
```

Open up grafana:

```
$ open http://grafana.localdns.xyz:3000
```

Use the initial user and password combination `admin/admin` and then reset your password:

![image](https://user-images.githubusercontent.com/567298/98379039-7efdce80-204f-11eb-9c8a-3ed12a63cb14.png)

Browse for your labels on the log explorer section, in my example it will be `{job="dockerlogs"}`:

![image](https://user-images.githubusercontent.com/567298/98379172-ace31300-204f-11eb-8e6c-3cf073afe771.png)

When we select our job="dockerlogs" label, we will see our logs:

![image](https://user-images.githubusercontent.com/567298/98379288-c71cf100-204f-11eb-911c-043a983bae6d.png)

As I explained earlier the query that we will be running in our ruler, can be checked what the rate currently is:

```
sum by (compose_project, compose_service) (rate({job="dockerlogs"}[1m]))
```

Which will look like this:

![image](https://user-images.githubusercontent.com/567298/98379765-54604580-2050-11eb-9c90-5e0adf2bb586.png)

In the configured expression in our ruler config, we have set to alarm once the value goes above 60, we can validate this by running:

```
sum by (compose_project, compose_service) (rate({job="dockerlogs"}[1m])) > 60
```

And we can verify that this is the case, and by now it should be alarming:

![image](https://user-images.githubusercontent.com/567298/98379900-84a7e400-2050-11eb-87d0-ae52617d195e.png)

Head over to alertmanager:

```
$ open http://alertmanager.localdns.xyz:9093
```

We can see alertmanager is showing the alarm:

![image](https://user-images.githubusercontent.com/567298/98380013-af923800-2050-11eb-8585-f7489bf722cb.png)

When we head over to slack, we can see our notification:

![image](https://user-images.githubusercontent.com/567298/98380158-de101300-2050-11eb-8d73-20828124fab5.png)

So let's stop our http client:

```
$ docker-compose stop http-client
Stopping http-client ... done
```

Then we can see the logging stopped:

![image](https://user-images.githubusercontent.com/567298/98380907-e0bf3800-2051-11eb-99c3-b3b9ac22bba5.png)

And in slack, we should see that the alarm recovered and we should see the notification:

![image](https://user-images.githubusercontent.com/567298/98381360-722eaa00-2052-11eb-8bb4-07cdc8ffa7ee.png)

Then you can terminate your stack:

```
$ docker-compose down
```

Pretty epic stuff right? I really love how cost effective Loki is as logging use to be so expensive to run and especially maintain, Grafana Labs are really doing some epic work and my hat goes off to them.

## Thanks

I hope you found this useful, feel free to reach out to me on Twitter **[@ruanbekker](https://twitter.com/ruanbekker)** or visit me on my website **[ruan.dev](https://ruan.dev)**


