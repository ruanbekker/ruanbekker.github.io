---
layout: post
title: "Setup a Blog with Hugo"
date: 2019-04-23 05:41:10 -0400
comments: true
categories: ["hugo", "golang", "blog"] 
---

![image](https://user-images.githubusercontent.com/30043398/56571367-13632600-65bd-11e9-816e-a18785233e38.png)


In this post we will setup a blog on [hugo](https://gohugo.io) and using the theme [pickles](https://github.com/mismith0227/hugo_theme_pickles).

## What is Hugo

Hugo is a Open-Source Static Site Generator which runs on Golang.

## Installing Hugo

Im using a mac so I will be installing hugo with brew, for other operating systems, you can have a look at [their documentation](https://gohugo.io/getting-started/installing/) 

```
$ brew install hugo
```

Create your new site:

```
$ hugo new site myblog
```

## Install a Theme

We will use a 3rd party theme, go ahead and install the pickles theme:

```
$ git clone -b release https://github.com/mismith0227/hugo_theme_pickles themes/pickles
```

## Custom Syntax Highlighting

Generate syntax highlight css, for a list of other styles [see this post](https://help.farbox.com/pygments.html)

```
$ mkdir -p static/css
$ hugo gen chromastyles --style=colorful > static/css/syntax.css
```

Append this below `style.css` in `themes/pickles/layouts/partials/head.html`

```
<link rel="stylesheet" href="{{ .Site.BaseURL }}/css/syntax.css"/>
```

set pygments settings in `config.toml`:

```
baseURL = "http://example.org/"
languageCode = "en-us"
pygmentsCodeFences = true
pygmentsUseClasses = true
title = "My Hugo Site"
```

## Create your First Blogpost

Create your first post:

```
$ hugo new posts/my-first-post.md
/Users/ruan/myblog/content/posts/my-first-post.md created
```

Populate your page with some data:

```
---
title: "My First Post"
date: 2019-04-23T09:39:23+02:00
description: This is an introduction post to showcase Hugo.
slug: hello-world-my-first-post
categories:
- hugo
- blog
tags:
- helloworld
- hugo
- blog
draft: false
---

![](https://hugo-simple-blog.work/images/uploads/gopher_hugo.png)

Hello world and welcome to my first post

## New Beginning

This is a new beginning on my blog on hugo and this seems pretty cool so im adding random text here because I dont know **what** to add here. So im adding a lot more random text here.

This is another test.

## Code

This is python code:

{{< highlight python >}}
from random import randint
from faker import Fake
randint(1, 2)

destFile = "largedataset-" + timestart + ".txt"
file_object = open(destFile,"a")
file_object.write("uuid" + "," + "username" + "," + "name" + "," + "country" + "\n")

def create_names(fake):
    for x in range(numberRuns):
        genUname = fake.slug()
        genName =  fake.first_name()
        genCountry = fake.country()
file_object.write(genUname + "," + genName + "," + genCountry + "\n")
..
{{< /highlight >}}

This is bash code:

{{< highlight python >}}
#!/usr/bin/env bash
var="ruan"
echo "Hello, ${var}"
{{< /highlight >}}

## Tweets

This is one of my tweets, see [configuration](https://gohugo.io/content-management/shortcodes/#highlight) for more shortcodes:

{{< tweet 1118930084356853770 >}}

## Tables

This is a table:

|**id**    |**name**|**surname**|**age**| **city**     |
|----------|--------|-----------|-------|--------------|
|20-1232091|ruan    |bekker     |32     |cape town     |
|20-2531020|stefan  |bester     |32     |kroonstad     |
|20-4835056|michael |le roux    |35     |port elizabeth|

## Lists

This is a list:

* one
* two
* [three](https://example.com)

This is another list:

1. one
2. two
3. [three](https://example.com)

## Images

This is an embedded photo:

![](https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500)
```

## Run the Server

You can set the flags in your main config as well. Go ahead and run the server:

```
$ hugo server \
  --baseURL "http://localhost/" \
  --themesDir=themes --theme=pickles \
  --bind=0.0.0.0 --port=8080 --appendPort=true \
  --buildDrafts --watch --environment production
```

## Screenshots

When you access your blog on port 8080 you should see your post. Some screenshots below:

<img width="1227" alt="image" src="https://user-images.githubusercontent.com/30043398/56570645-9e432100-65bb-11e9-9ea4-dd89be65bed4.png">

<img width="1143" alt="image" src="https://user-images.githubusercontent.com/30043398/56570670-aac77980-65bb-11e9-830d-4424e6d92beb.png">

<img width="1110" alt="image" src="https://user-images.githubusercontent.com/30043398/56570707-b74bd200-65bb-11e9-8df2-8aa1372e2922.png">

<img width="1196" alt="image" src="https://user-images.githubusercontent.com/30043398/56570734-c16dd080-65bb-11e9-92fc-55c7ace373e8.png">

## References:

- https://gohugo.io/getting-started/installing/
- https://gohugo.io/content-management/syntax-highlighting/
- https://willschenk.com/articles/2018/building-a-hugo-site/
