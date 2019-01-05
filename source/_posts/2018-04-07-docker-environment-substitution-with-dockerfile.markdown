---
layout: post
title: "Docker Environment Substitution with Dockerfile"
date: 2018-04-07 09:18:20 -0400
comments: true
categories: ["docker", "environment", "12factor"] 
---

The [12 Factor](https://12factor.net/) way, is a general guideline that provides best practices when building applications. One of them is using environment variables to store application configuration.

<script id="mNCC" language="javascript">
    medianet_width = "728";
    medianet_height = "90";
    medianet_crid = "218284798";
    medianet_versionId = "3111299"; 
  </script>
<script src="//contextual.media.net/nmedianet.js?cid=8CUD78FSV"></script>

## What will we be doing:

In this post we will build a simple docker application that returns the environment variable's value to standard out. We are using environment substitution, so if the environment variable is not provided, we will set a default value of `NOT_DEFINED`.

We will have the environment variable `OWNER` and when no value is set for that Environment Variable, the `NOT_DEFINED` value will be returned.

## The Dockerfile

Our Dockerfile:

```dockerfile
FROM alpine:edge
ENV OWNER=${OWNER:-NOT_DEFINED}
CMD ["sh", "-c", "echo env var: ${OWNER}"]
```

Building the image:

```bash
$ docker build -t test:envs .
```

## Putting it to action:

Now we will run a container and pass the `OWNER` environment variable as an option:

```bash
$ docker run -it -e OWNER=ruan test:envs . 
env var: ruan
```

When we run a container without specifying the environment variable:

```bash
$ docker run -it ruan:test 
env var: NOT_DEFINED
```

## Resources:

- https://stackify.com/config-values-docker-containers-environment-variables/
- https://tryolabs.com/blog/2015/03/26/configurable-docker-containers-for-multiple-environments/

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
</form>
</center>

<br>

Ad space:

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>

<p>

Thanks for reading!
