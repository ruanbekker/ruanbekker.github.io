---
layout: post
title: "Get the Top 10 Items on Hackernews in Python"
date: 2020-06-13 19:53:20 +0200
comments: true
categories: ["python", "scripting"]
---

This is a quick post on how to use python to get the 10 latest items from hackernews:

```
import requests
import json

def get_top_ten():
    ids = requests.get('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty').json()[0:10]
    for id in ids:
        postresponse = requests.get('https://hacker-news.firebaseio.com/v0/item/{postid}.json?print=pretty'.format(postid=id)).json()
        formatted = {"title": postresponse["title"], "type": postresponse["type"], "url": postresponse["url"], "by": postresponse["by"]}
        print(json.dumps(formatted, indent=2))
```

When running it:

```
>>> get_top_ten()
..
{
  "title": "Play Counter-Strike 1.6 in your browser",
  "type": "story",
  "url": "http://cs-online.club",
  "by": "m0ck"
}
```
