---
layout: post
title: "Get Blogpost Titles Links and Tags from a RSS Link using Python Feedparser"
date: 2018-08-15 18:14:54 -0400
comments: true
categories: ["python", "rss", "feedparser", "web-scraping"] 
---

![](https://objects.ruanbekker.com/assets/images/python-logo.png)

I wanted to get metadata from my other blog [sysadmins.co.za](https://sysadmins.co.za), such as each post's title, link and tags using the RSS link. I stumbled upon `feedparser`, where I will use it to scrape all the posts details from the link and append it to a list, which I can then use to ingest it into a database or something like that.

## Installing Dependencies:

Install feedparser and requests:

```bash
$ pip install feedparser requests
```

## The Python Code:

I'm not too sure at this point how to get pagination going, so I've set a range to check, and if a status code of `200` is received, it will check if the title is in the list that I defined, if not, it will append it to the list.

At the end of the loop, the script will return the list that was defined, which will provide the info mentioned earlier:

```python
import feedparser
import time
import requests

rss_url = "https://sysadmins.co.za/rss"

posts = []

def get_posts_for_ghost(rss_url):
    response = feedparser.parse(rss_url)
    for each in response['entries']:
        if each['title'] in [x['title'] for x in posts]:
            pass
        else:
            posts.append({
                "title": each['title'],
                "link": each['links'][0]['href'],
                "tags": [x['term'] for x in each['tags']],
                "date": time.strftime('%Y-%m-%d', each['published_parsed'])
            })
    return posts

count = 12

for x in range(count):
    if requests.get("{0}/{1}/".format(rss_url, count)).status_code == 200:
        print("get succeeded, count at: {}".format(count))
        get_posts_for_ghost("{0}/{1}/".format(rss_url, count))
        count -= 1
    else:
        print("got 404, count at: {}".format(count))
        count -= 1

    get_posts_for_ghost(rss_url)

print(posts)
```

## Running the script:

Running the script will look something like this:

```bash
$ python rssfeed.py
got 404, count at: 12
got 404, count at: 11
got 404, count at: 10
get succeeded, count at: 9
get succeeded, count at: 8
get succeeded, count at: 7
get succeeded, count at: 6
get succeeded, count at: 5
get succeeded, count at: 4
get succeeded, count at: 3
get succeeded, count at: 2
get succeeded, count at: 1
[
  {
    'title': 'Tutorial on DynamoDB using Bash and the AWS CLI Tools to Interact with a Music Dataset', 
    'link': 'https://sysadmins.co.za/tutorial-on-dynamodb-using-bash-and-the-aws-cli-tools-to-interact-with-a-music-dataset/',
    'tags': ['DynamoDB', 'Bash', 'AWS'], 
    'date': '2018-08-15'
  },
  {
    'title': 'Setup a PPTP VPN on Ubuntu 16', 
    'link': 'https://sysadmins.co.za/setup-a-pptp-vpn-on-ubuntu-16/', 
    'tags': ['Networking', 'VPN'], 
    'date': '2018-06-27'
  },
  ...
```
