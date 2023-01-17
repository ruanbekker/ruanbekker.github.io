---
layout: post
title: "Getting Started with Wiremock"
date: 2023-01-14 17:03:12 -0500
comments: true
categories: ["wiremock", "devops", "restapi", "docker"] 
---

In this tutorial we will use docker to run an instance of wiremock to setup a mock api for us to test our api's.

## Wiremock

[Wiremock](https://wiremock.org/) is a tool for building mock API's which enables us to build stable development environments.

## Docker and Wiremock

Run a wiremock instance with docker:

```bash
docker run -it --rm -p 8080:8080 --name wiremock wiremock/wiremock:2.34.0
```

Then our wiremock instance will be exposed on port 8080 locally, which we can use to make a request against to create a api mapping:

```bash
curl -XPOST -H "Content-Type: application/json" \
  http://localhost:8080/__admin/mappings
  -d '{"request": {"url": "/testapi","method": "GET"}, "response": {"status": 200, "body": "{\"result\": \"ok\"
}", "headers": {"Content-Type": "application/json"}}}'
```

The response should be something like this:

```json
{
    "id" : "223a2c0a-8b43-42dc-8ba6-fe973da1e420",
    "request" : {
      "url" : "/testapi",
      "method" : "GET"
    },
    "response" : {
      "status" : 200,
      "body" : "{\"result\": \"ok\"}",
      "headers" : {
        "Content-Type" : "application/json"
      }
    },
    "uuid" : "223a2c0a-8b43-42dc-8ba6-fe973da1e420"
}
```

## Test Wiremock

If we make a GET request against our API:

```bash
curl http://localhost:8080/testapi
```

Our response should be:

```json
{
  "result": "ok"
}
```

## Export Wiremock Mappings

We can export our mappings to a local file named `stubs.json` with:

```bash
curl -s http://localhost:8080/__admin/mappings --output stubs.json
```

## Import Wiremock Mappings

We can import our mappings from our `stubs.json` file with:

```bash
curl -XPOST -v --data-binary @stubs.json http://localhost:8080/__admin/mappings/import
```

## Resources

- https://wiremock.org/docs/docker/
- https://github.com/WireMock-Net/WireMock.Net/wiki/Admin-API-Reference

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon

