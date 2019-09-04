---
layout: post
title: "Deploy a Monitoring Stack on Docker Swarm with Grafana and Prometheus"
date: 2019-09-05 00:07:52 +0200
comments: true
categories: ["prometheus", "grafana", "docker", "swarm", "monitoring"] 
---

![](https://user-images.githubusercontent.com/567298/57307750-696bb980-70e5-11e9-9b0b-73ad88bde6a3.png)

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/bekkerstacks/traefik)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

In this tutorial we will deploy a monitoring stack to docker swarm, that includes Grafana, Prometheus, Node-Exporter, cAdvisor and Alertmanager.

If you are looking for more information on Prometheus, have a look at my other [Prometheus and Monitoring](https://blog.ruanbekker.com/blog/categories/prometheus/) blog posts.

## What you will get out of this

Once you deployed the stacks, you will have the following:

- Access Grafana through Traefik reverse proxy
- Node-Exporter to expose node level metrics
- cAdvisor to expose container level metrics
- Prometheus to scrape the exposed entpoints and ingest it into Prometheus
- Prometheus for your Timeseries Database
- Alertmanager for firing alerts on configured rules

The compose file that I will provide will have pre-populated dashboards

## Deploy Traefik

Get the traefik stack sources:

```
$ git clone https://github.com/bekkerstacks/traefik
$ pushd traefik
```

Have a look at [HTTPS Mode](https://github.com/bekkerstacks/traefik/wiki/Deploy-Traefik-in-HTTPS-Mode) if you want to deploy traefik on HTTPS, as I will use HTTP in this demonstration.

Set your domain and deploy the stack:

```
$ DOMAIN=localhost PROTOCOL=http bash deploy.sh

Username for Traefik UI: demo
Password for Traefik UI: 
deploying traefik stack in http mode
Creating network public
Creating config proxy_traefik_htpasswd
Creating service proxy_traefik
Traefik UI is available at:
- http://traefik.localhost
```

Your traefik service should be running:

```
$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
0wga71zbx1pe        proxy_traefik       replicated          1/1                 traefik:1.7.14      *:80->80/tcp
```

Switch back to the previous directory:

```
$ popd
```

## Deploy the Monitoring Stack

Get the sources:

```
$ git clone https://github.com/bekkerstacks/monitoring-cpang
$ pushd monitoring-cpang
```

If you want to deploy the stack with no pre-configured dashboards, you would need to use `./docker-compose.html`, but in this case we will deploy the stack with pre-configured dashboards.

Set the domain and deploy the stack:

```
$ docker stack deploy -c alt_versions/docker-compose_http_with_dashboards.yml mon

Creating network private
Creating config mon_grafana_config_datasource
Creating config mon_grafana_dashboard_prometheus
Creating config mon_grafana_dashboard_docker
Creating config mon_grafana_dashboard_nodes
Creating config mon_grafana_dashboard_blackbox
Creating config mon_alertmanager_config
Creating config mon_prometheus_config
Creating config mon_prometheus_rules
Creating service mon_blackbox-exporter
Creating service mon_alertmanager
Creating service mon_prometheus
Creating service mon_grafana
Creating service mon_cadvisor
Creating service mon_node-exporter
```

The endpoints is configured as `${service_name}.${DOMAIN}` so you will be able to access grafana on `http://grafana.localhost` as showed in my use-case.

Use `docker stack services mon` to see if all the tasks has checked into its desired count then access grafana on `http://grafana.${DOMAIN}`

## Accessing Grafana

Access Grafana on `http://grafana.${DOMAIN}` and logon with the user admin and the password admin:

![image](https://user-images.githubusercontent.com/50801771/64292266-4d303a00-cf6a-11e9-8a49-2ae05b1ed5c6.png)

You will be asked to reset the password:

![image](https://user-images.githubusercontent.com/50801771/64292291-5f11dd00-cf6a-11e9-8049-2abdbb0164f6.png)

You will then be directed to the ui:

![image](https://user-images.githubusercontent.com/50801771/64292317-705ae980-cf6a-11e9-928b-60b5dec7ea09.png)

From the top, when you list dashboards, you will see the 3 dashboards that was pre-configured:

![image](https://user-images.githubusercontent.com/50801771/64292334-7b157e80-cf6a-11e9-92c6-9e0698815ba7.png)

When looking at the Swarm Nodes Dashboard:

![image](https://user-images.githubusercontent.com/50801771/64297086-82da2080-cf74-11e9-8060-f0193bfaeb13.png)

The Swarm Services Dashboard:

![image](https://user-images.githubusercontent.com/50801771/64297656-a8ffc080-cf74-11e9-88a2-b4cec295aed5.png)

## Exploring Metrics in Prometheus

Access prometheus on `http://prometheus.${DOMAIN}` and from the search input, you can start exploring though all the metrics that is available in prometheus:

![image](https://user-images.githubusercontent.com/50801771/64298324-74403900-cf75-11e9-99b7-559b02ef67b7.png)

If we search for `node_load15` and select graph, we can have a quick look on how the 15 minute load average looks like for the node where the stack is running on:

![image](https://user-images.githubusercontent.com/50801771/64298454-e31d9200-cf75-11e9-89bb-b6fe94470166.png)

Having a look at the alerts section:

![image](https://user-images.githubusercontent.com/50801771/64299172-7657c700-cf78-11e9-97bd-143e5fe87941.png)

## Resources

For more information and configuration on the stack that we use, have a look at the wiki:
- https://github.com/bekkerstacks/monitoring-cpang/wiki

The github repository:
- https://github.com/bekkerstacks/monitoring-cpang

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

