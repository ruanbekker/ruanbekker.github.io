---
layout: post
title: "Set Docker Environment Variables during Build Time"
date: 2018-04-07 09:51:35 -0400
comments: true
categories: ["docker", "environment", "12factor"] 
---

When using that `ARG` option in your Dockerfile, you can specify the `--build-args` option to define the value for the key that you specify in your Dockerfile to use for a environment variable as an example.

Today we will use the `arg` and `env` to set environment variables at build time.

## The Dockerfile:

Our Dockerfile

```dockerfile
FROM alpine:edge
ARG NAME
ENV OWNER=${NAME:-NOT_DEFINED}
CMD ["sh", "-c", "echo env var: ${OWNER}"]
```

Building our Image, we will pass the value to our NAME argument:

```bash
$ docker build --build-arg NAME=james -t ruan:test .
```

Now when we run our container, we will notice that the build time argument has passed through to our environment variable from the running container:

```bash
$ docker run -it ruan:test 
env var: james

```

When we build the image without specifying build arguments, and running the container:

```bash
$ docker build -t ruan:test .
$ docker run -it ruan:test 
env var: NOT_DEFINED
```

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
