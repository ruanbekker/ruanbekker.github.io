---
layout: post
title: "New Posts on Github Pages with Octopress not Showing on your Blog"
date: 2017-10-25 06:54:59 -0400
comments: true
categories: ["octopress", "github-pages"] 
---

So today I had the issue where new posts that was generated and pushed to github, not being displayed on my blog.

I was able to see the markdown pages on my github respository, but via the blog itself, getting 404's.

## The Issue:

When I did a `rake generate` I found the following error:

```bash
jekyll 2.5.3 | Error: invalid byte sequence in US-ASCII
``` 

## Resolving the Issue:

After running the following, I was able to get rid of the error, and posts showing again:

```bash
$ export LC_ALL="en_US.UTF-8"
$ export LANG="en_US.UTF-8"
```


 
