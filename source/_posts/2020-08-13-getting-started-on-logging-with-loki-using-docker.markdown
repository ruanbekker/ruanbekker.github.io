---
layout: post
title: "Getting Started on Logging with Loki using Docker"
date: 2020-08-13 13:39:28 +0000
comments: true
categories: ["logging", "loki", "docker", "grafana"] 
---

Logging with Loki is AMAZING!

In the past couple of months i've been working a lot with logging, but more specifically logging with loki. As most of my metrics reside in prometheus, I use grafana quite extensively and logging was always the one that stood out a bit as I pushed my logs to elasticsearch and consumed them from grafana. Which worked pretty well, but the maintenance and resource costs was a bit too much for what I was looking for.

And then grafana released Loki, which is like prometheus, but for logs. And that was just super, exactly what I was looking for. For my use case, I was looking for something that can be consumed by grafana as a presentation layer, central based so I can push all sorts of logs, and want a easy way to grep for logs and a bonus would be to have a cli tool.

And Loki checked all those boxes!

<div class="tenor-gif-embed" data-postid="7644619" data-share-method="host" data-width="100%" data-aspect-ratio="1.1971153846153846"><a href="https://tenor.com/view/oh-yeah-gif-7644619">Oh Yeah Parks And Recreation GIF</a> from <a href="https://tenor.com/search/ohyeah-gifs">Ohyeah GIFs</a></div><script type="text/javascript" async src="https://tenor.com/embed.js"></script>

## What can you expect from this blog

In this post will be a getting started guide to Loki, we will provision Loki, Grafana and Nginx using Docker to get our environment up and running, so that we can push our nginx container logs to the loki datasource, and access the logs via grafana.

We will then generate some logs so that we can show a couple of query examples using the log query language (LogQL) and use the LogCLI to access our logs via cli.

In a [future post](), I will demonstrate how to setup Loki for a non-docker deployment.

## Some useful information about Loki

Let's first talk about Loki compared with Elasticsearch, as they are not the same:

1. Loki does not index the text of the logs, instead grouping entries into streams and index those with labels
2. Things like full text search engines tokenizes your text into k/v pairs and gets written to an inverted index, which over time in my opinion gets complex to maintain, expensive to scale, storage retention, etc.
3. Loki is advertised as easy to scale, affordable to operate as it uses DynamoDB for Indexing and S3 for Storage
4. When using Loki, you may need to forget what you know and look to see how the problem can be solved differently with parallelization. Loki’s superpower is breaking up queries into small pieces and dispatching them in parallel so that you can query huge amounts of log data in small amounts of time.

If we look at the **Loki Log Model**, we can see that the timestamp and the labels are indexed and the content of the logs are not indexed:

![loki](https://img.sysadmins.co.za/cpr6n7.png)

A **log stream** is a stream of log entries with the same exact label set:

![loki](https://img.sysadmins.co.za/el6djk.png)

For the **storage** side, inside each chunk, log entries are sorted by timestamp. Loki only indexes minimum and maximum timestamps of a chunk. Storage options support local storage, AWS S3, Google Cloud Storage and Azure

![loki](https://img.sysadmins.co.za/959pjw.png)

For **chunks and querying**, chunks are filled per stream and they are flushed of a few criterias such as age and size:

![loki](https://img.sysadmins.co.za/ekm8cy.png)

And one of the most important parts are the **labels**, labels define the stream and therefore its very important. 

High cardinality is bad for labels, as something like a IP address can reduce your performance a lot, as it will create a stream for every unique IP label.

Static defined labels such as environment, hostnames are good, you can read more up about it [here](https://grafana.com/blog/2020/04/21/how-labels-in-loki-can-make-log-queries-faster-and-easier/)

Here is a info graphic on how one log line can be split up into 36 streams:

![](https://img.sysadmins.co.za/g119oq.png)

So with that being said, **good labels** will be considered as cluster, job, namespace, environment, etc where as **bad labels** will be things such as userid, ip address, url path, etc

## Selecting logstreams with Loki

Selecting logstreams, is done by using **label matchers** and **filter expressions**, such as this example:

```
{job="dockerlogs", environment="development"} |= "POST" |~ "196.35.64.+"
```

Label Matchers and Filter Expressions support:

  - `=` Contains string
  - `!=` Does not contain string
  - `=~` Matches regular expression
  - `!~` Does not match regular expression

## Supported Clients

At the moment of writing, loki supports the following log clients:

  - Promtail (tails logs and ships to Loki)
  - Docker Driver
  - Fluentd
  - Fluent Bit
  - Logstash

We will be going into more detail on using promtail in a [future post](), but you can read more up about it [here](https://github.com/grafana/loki/tree/master/cmd)

## Loki in Action

Time to get to the fun part, clone my [github repo](https://github.com/ruanbekker/loki-docker-nginx-example):

```
$ git clone https://github.com/ruanbekker/loki-docker-nginx-example
$ cd loki-docker-nginx-example
```

You can inspect the docker-compose.yml:

```
$ cat docker-compose.yml
version: "3.4"

services:
  my-nginx-service:
    image: nginx
    container_name: my-nginx-service
    ports:
      - 8000:80
    environment:
      - FOO=bar
    logging:
      driver: loki
      options:
        loki-url: http://localhost:3100/loki/api/v1/push
        loki-external-labels: job=dockerlogs,owner=ruan,environment=development

  grafana:
    image: grafana/grafana:7.1.1
    volumes:
    - ./config/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
    ports:
    - "3000:3000"

  loki:
   image: grafana/loki:v1.3.0
   volumes:
     - ./config/loki.yaml:/etc/config/loki.yaml
   entrypoint:
     - /usr/bin/loki
     - -config.file=/etc/config/loki.yaml
   ports:
     - "3100:3100"
```

As you can see loki will be the datasource where we will be pushing our logs to from our nginx container and we are defining our logging section where it should find loki and we are also setting labels to that log stream using `loki-external-labels`. Then we are using grafana to auto configure the loki datasource from the `./config/datasource.yml` section so that we can visualize our logs.

If you don't want to define the logging section per container, you can always set the defaults using the `/etc/docker/daemon.json` by following [this guide](https://grafana.com/docs/loki/latest/clients/docker-driver/configuration/#change-the-default-logging-driver)

Let's boot up our stack:

```
$ docker-compose up
```

After everything is up, you should be able to access nginx by visiting: `http://nginx.localdns.xyz:8000/`, after you received a response, visit Grafana on `http://grafana.localdns.xyz:3000` using the username and password: `admin/admin`.

If you head over to datasources, you should see the loki datasource which was provisioned for you:

![loki-grafana](https://img.sysadmins.co.za/tyn0ny.png)

When you head to the left on explore and you select the loki datasource on `http://grafana.localdns.xyz:3000/explore` you should see the following:

![loki-grafana](https://img.sysadmins.co.za/5kp07m.png)

You will see that grafana discovers logstreams with the label `job` as you can see that our `job="dockerlogs"` can be seen there. We can either click on it, select the log labels from the left and browse the label we want to select or manually enter the query.

I will be using the query manually:

```
{job="dockerlogs"}
```

So now we will get all the logs that has that label associated and as you can see, we see our request that we made:

![nginx-grafana-loki](https://img.sysadmins.co.za/gra0oe.png)

We can see one error due to the favicon.ico that it could not find, but let's first inspect our first log line:

![loki](https://img.sysadmins.co.za/6dbuqn.png)

Here we can see the labels assigned to that log event, which we can include in our query, like if we had multiple services and different environments, we can use a query like the following to only see logs for a specific service and environment:

```
{job="dockerlogs", environment="development", compose_service="my-nginx-service"}
```

In the example above we used the selectors to select the logs we want to see, now we can use our filter expressions, to "grep" our logs. 

Let's say we want to focus only on one service, and we want to filter for any logs with GET requests, so first we select to service then apply the filter expression:

```
{compose_service="my-nginx-service"} |= "GET"
```

![loki-logs](https://img.sysadmins.co.za/vv609g.png)

As you can see we can see the ones we were looking for, we can also chain them, so we want to se GET's and errors:

```
{compose_service="my-nginx-service"} |= "GET" |= "error"
```

And lets say for some reason we only want to see the logs that comes from a 192.168.32 subnet:

```
{compose_service="my-nginx-service"} |= "GET" |= "error" |~ "192.168.32."
```

But we dont want to see requests from "nginx.localdns.xyz":

```
{compose_service="my-nginx-service"} |= "GET" |= "error" |~ "192.168.32." != "nginx.localdns.xyz"
```

Make two extra get requests to "foo.localdns.xyz:8000" and "bar.localdns.xyz:8000" and then we change the query to say that we only want to see errors and hostnames coming from the 2 requests that we made:

```
{compose_service="my-nginx-service"} |= "error" |~ "(foo|bar).localdns.xyz"
```

If we expand one of the log lines, we can do a ad-hoc analysis to see the percentage of logs by source for example:

![loki-logs](https://img.sysadmins.co.za/9ctz6d.png)

## LogCLI

If you prefer the cli to query logs, logcli is the command line client for loki, allows you to query logs from your terminal and has clients for linux, mac and windows.

Check the releases for the latest version:

  - https://github.com/grafana/loki/releases

```
$ wget https://github.com/grafana/loki/releases/download/v1.5.0/logcli-darwin-amd64.zip
$ unzip logcli-darwin-amd64.zip
$ mv logcli-darwin-amd64 /usr/local/bin/logcli
```

Set your environment details, in our case we dont have a username and password for loki:

```
$ #export LOKI_USERNAME=${MYUSER}
$ #export LOKI_PASSWORD=${MYPASS}
$ export LOKI_ADDR=http://localhost:3001
```

We can view all our labels, let’s view all the job labels:

```
$ logcli labels job
http://localhost:3001/loki/api/v1/label/job/values
dockerlogs
```

Let’s look at family apps nginx logs:

```
$ logcli query '{job="dockerlogs"}'
http://localhost:3001/loki/api/v1/query_range?direction=BACKWARD&end=1587727924005496000&limit=30&query=%7Bjob%3D%22dockerlogs%22%2C&start=1587724324005496000
Common labels: {environment="development", owner="ruan", compose_service="my-nginx-service", job="dockerlogs", host="docker-desktop", compose_project="loki-nginx-docker"}
2020-08-13 17:08:40 192.168.32.1 - - [13/Aug/2020:15:08:40 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:79.0) Gecko/20100101 Firefox/79.0" "-"
```

We can also pipe that output to grep, awk, etc:

```
$ logcli query '{job="dockerlogs"}' | grep GREP | awk -F 'X' '{print  $1}'
```

Supported arguments:

```
$ logcli query --help
usage: logcli query [<flags>] <query>


Run a LogQL query.


Flags:
      --help             Show context-sensitive help (also try --help-long and --help-man).
      --version          Show application version.
  -q, --quiet            suppress everything but log lines
      --stats            show query statistics
  -o, --output=default   specify output mode [default, raw, jsonl]
  -z, --timezone=Local   Specify the timezone to use when formatting output timestamps [Local, UTC]
      --addr="http://localhost:3100"
                         Server address. Can also be set using LOKI_ADDR env var.
      --username=""      Username for HTTP basic auth. Can also be set using LOKI_USERNAME env var.
      --password=""      Password for HTTP basic auth. Can also be set using LOKI_PASSWORD env var.
      --ca-cert=""       Path to the server Certificate Authority. Can also be set using LOKI_CA_CERT_PATH env var.
      --tls-skip-verify  Server certificate TLS skip verify.
      --cert=""          Path to the client certificate. Can also be set using LOKI_CLIENT_CERT_PATH env var.
      --key=""           Path to the client certificate key. Can also be set using LOKI_CLIENT_KEY_PATH env var.
      --org-id=ORG-ID    org ID header to be substituted for auth
      --limit=30         Limit on number of entries to print.
      --since=1h         Lookback window.
      --from=FROM        Start looking for logs at this absolute time (inclusive)
      --to=TO            Stop looking for logs at this absolute time (exclusive)
      --step=STEP        Query resolution step width
      --forward          Scan forwards through logs.
      --no-labels        Do not print any labels
      --exclude-label=EXCLUDE-LABEL ...
                         Exclude labels given the provided key during output.
      --include-label=INCLUDE-LABEL ...
                         Include labels given the provided key during output.
      --labels-length=0  Set a fixed padding to labels
  -t, --tail             Tail the logs
      --delay-for=0      Delay in tailing by number of seconds to accumulate logs for re-ordering


Args:
  <query>  eg '{foo="bar",baz=~".*blip"} |~ ".*error.*"'
```

## Thank you

I hope this was useful
