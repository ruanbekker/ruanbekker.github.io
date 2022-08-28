---
layout: post
title: "Create a Lightweight Webserver (Service) with Lighttpd on Alpine running on Docker Swarm"
date: 2017-08-26 11:37:19 -0400
comments: true
categories: ["docker", "alpine", "lighttpd", "html"] 
---

In this post we will create a docker service that will host a static html website. We are using the `alpine:edge` image and using the `lighttpd` package as our webserver application.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## The Directory Structure:

Our working directory consists of:

```bash Directory Tree
$ tree
.
|-- Dockerfile
`-- htdocs
    `-- index.html

1 directory, 2 files
```

First, our `Dockerfile`:

```bash Dockerfile
FROM alpine:edge

RUN apk update \
    && apk add lighttpd \
    && rm -rf /var/cache/apk/*

ADD htdocs /var/www/localhost/htdocs

CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
```

Then our `htdocs/index.html` which is based off bootstrap:

```html index.html
<!DOCTYPE html>
<html lang="en">

  <head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Bare - Start Bootstrap Template</title>

    <!-- Bootstrap core CSS -->
    <link href="https://objects.ruanbekker.com/assets/css/bootstrap/start-bootstrap-template/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <style>
      body {
        padding-top: 54px;
      }
      @media (min-width: 992px) {
        body {
          padding-top: 56px;
        }
      }

    </style>

  </head>

  <body>

    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div class="container">
        <a class="navbar-brand" href="#">Start Bootstrap</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarResponsive">
          <ul class="navbar-nav ml-auto">
            <li class="nav-item active">
              <a class="nav-link" href="#">Home
                <span class="sr-only">(current)</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="https://startbootstrap.com/template-overviews/bare/">About</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Services</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <div class="container">

      <div class="row">
        <div class="col-lg-12 text-center">
          <h1 class="mt-5">A Bootstrap 4 Starter Template</h1>
          <p class="lead">Complete with pre-defined file paths and responsive navigation!</p>
          <ul class="list-unstyled">
            <li>Bootstrap 4.0.0-beta</li>
            <li>jQuery 3.2.1</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bootstrap core JavaScript -->
    <script src="https://objects.ruanbekker.com/assets/js/bootstrap/start-bootstrap-template/jquery.min.js"></script>
    <script src="https://objects.ruanbekker.com/assets/js/bootstrap/start-bootstrap-template/popper.min.js"></script>
    <script src="https://objects.ruanbekker.com/assets/js/bootstrap/start-bootstrap-template/bootstrap.min.js"></script>

  </body>

</html>
```

## Creating the Service:

First we will need to build the image, for my personal projects, I like to use gitlab's private registry, but there are many to choose from:

```bash Build the Image
$ docker login registry.gitlab.com
$ docker build -t registry.gitlab.com/<user>/<repo>/lighttpd:bootstrap .
$ docker push registry.gitlab.com/<user>/<repo>/lighttpd:bootstrap
```

There's many ways we can create the service, like using this service as a backend application, where nginx or traefik can proxy the requests through, but in this case we have nothing listening on port 80, so we will create the service and publish port 80 to the service, from the host:

```bash Create the Service
$ docker service create \
--name web-bootstrap \
--replicas 1 \
--network appnet \
--with-registry-auth registry.gitlab.com/<user>/<repo>/lighttpd:bootstrap
```

## Accessing your Website:

As this service will serve as our website, it should look more or less like the following:

![](https://user-images.githubusercontent.com/567298/53353187-dd8f2180-392c-11e9-93fe-fce614068866.jpg)
