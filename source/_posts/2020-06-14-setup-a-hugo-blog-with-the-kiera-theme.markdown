---
layout: post
title: "Setup a Hugo Blog with the Kiera Theme"
date: 2020-06-14 15:23:51 +0200
comments: true
categories: ["hugo"] 
---

![hugo-blog-kiera-theme](https://img.sysadmins.co.za/wngib2.png)

In this tutorial we will setup a Hugo Blog with the Kiera theme on Linux and will be using Ubuntu for this demonstration, but since Hugo runs on Go, you can run this on Windows, Linux or Mac.

## Dependencies

We require golang and hugo, so let's first start with installing go:

```
$ apt update && apt install git -y
$ VERSION=1.14.4
$ wget "https://dl.google.com/go/go${VERSION}.linux-amd64.tar.gz"
$ tar -xf go$VERSION.linux-amd64.tar.gz -C /usr/local
$ echo 'export HUGO_HOME=/usr/local/hugo' >> ~/.profile
$ echo 'export PATH=$PATH:$HUGO_HOME/bin' >> ~/.profile
```

When we source our profile, we sound be able to get the go version:

```
$ source ~/.profile
$ go version
go version go1.14.4 linux/amd64
```

Now to install Hugo:

```
$ mkdir -p /usr/local/hugo/bin
$ echo 'export HUGO_HOME=/usr/local/hugo' >> ~/.profile
$ echo 'export PATH=$PATH:$HUGO_HOME/bin' >> ~/.profile
```

After sourcing the profile we should see the hugo version:

```
$ source ~/.profile
$ hugo version
Hugo Static Site Generator v0.72.0-8A7EF3CF linux/amd64 BuildDate: 2020-05-31T12:07:45Z
```

## Create the Hugo Workspace

Create the directory where we will host our blogs and change into that directory:

```
$ mkdir -p ~/websites 
$ cd ~/websites
```

Create your site with hugo:

```
$ hugo new site awesome-blog
Congratulations! Your new Hugo site is created in /home/ubuntu/websites/awesome-blog.
Visit https://gohugo.io/ for quickstart guide and full documentation.
```

Change into the directory that was created:

```
$ cd awesome-blog/
```

## Themes

Hugo has a [extensive list of themes](https://themes.gohugo.io/), but for this demonstration we will use [kiera](https://themes.gohugo.io/hugo-kiera/).

Download the theme to the themes directory:

```
$ git clone https://github.com/avianto/hugo-kiera themes/kiera
```

Let's run the server and see how it looks like out of the box:

```
$ hugo server --theme=kiera --bind=0.0.0.0 --environment development
```

By default hugo uses the port 1313, so accessing Hugo should look like this:

![](https://img.sysadmins.co.za/iwqtmt.png)

## Customize Hugo

So let's customize Hugo a bit by adding some content such as a navbar and social icons:

```
$ cat ./config.yml
baseurl = "http://192.168.64.17/"
title = "My Hugo Blog"
copyright = "Copyright &copy; 2020 - Ruan Bekker"
canonifyurls = true
theme = "kiera"

paginate = 3

summaryLength = 30
enableEmoji = true
pygmentsCodeFences = true

[author]
    name = "Ruan Bekker"
    github = "ruanbekker"
    gitlab = "rbekker87"
    linkedin = "ruanbekker"
    facebook = ""
    twitter = "ruanbekker"
    instagram = ""

[params]
    tagline = "A Hugo theme for creative and technical writing"

[menu]

  [[menu.main]]
    identifier = "about"
    name = "about hugo"
    pre = "<i class='fa fa-heart'></i>"
    url = "/about/"
    weight = -110

  [[menu.main]]
    name = "getting started"
    post = "<span class='alert'>New!</span>"
    pre = "<i class='fa fa-road'></i>"
    url = "/getting-started/"
    weight = -100
```

After config has been applied to `./config.yml` and we start our server up again:

```
$ hugo server --theme=kiera --bind=0.0.0.0 --environment development
```

We should see this:

![](https://img.sysadmins.co.za/3dw9e9.png)

## Create your First Post

Creating the first post:

```
$ hugo new posts/my-first-post.md
/home/ubuntu/websites/awesome-blog/content/posts/my-first-post.md created
```

Let's add some sample data to our markdown file that hugo created:

```
+++
title = "My First Post"
date = 2020-06-14T15:47:17+02:00
draft = false
tags = ["hugo", "kiera"]
categories = ["hugo-blog"]
+++

-> markdown content here <-
```

When starting the server up again and viewing the home page:

![hugo-blog-with-home-page](https://img.sysadmins.co.za/srklwj.png)

And selecting the post:

![](https://img.sysadmins.co.za/v95p79.png)

Code snippets:

![code](https://img.sysadmins.co.za/0xufiy.png)

Tables, lists and images:

![hugo-blog](https://img.sysadmins.co.za/c317ij.png)

## Creating Pages

For the pages section (about, getting-started), we first create the directory:

```
$ mkdir content/getting-started
```

Then create the page under the directory:

```
$ hugo new content/getting-started/index.md
content/getting-started/index.md created
```

The content:

```
$ cat content/getting-started/index.md
---
title: "Getting Started"
date: 2020-06-14T16:11:07+02:00
draft: false
---

This is a getting started page
```

When we start up our server again and select the "getting-started" from the navbar on our home page:

![getting-started-page](https://img.sysadmins.co.za/rod8eo.png)

## Production Mode

You can set the flags in your main config as well, but running the server in production mode: 

```
$ hugo server \
  --baseURL "http://192.168.64.17/" \
  --themesDir=themes --theme=kiera \
  --bind=0.0.0.0 --port=1313 --appendPort=true \
  --buildDrafts --watch --environment production
```

## Thanks

Thanks for reading
