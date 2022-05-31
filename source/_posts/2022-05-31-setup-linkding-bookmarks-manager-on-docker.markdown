---
layout: post
title: "Setup Linkding Bookmarks Manager on Docker"
date: 2022-05-31 15:50:24 -0400
comments: true
description: "Linkding is a Bookmarks Service that runs on docker and is self-hosted. This tutorial will demonstrate how to setup linkding on docker."
categories: ["docker", "bookmarks", "self-hosted"] 
---

**Note**:  *Originally posted on [containers.fan](https://containers.fan/posts/setup-linkding-bookmarks-manager/)* 

I've stumbled upon a great bookmarks manager service called **[Linkding](https://github.com/sissbruecker/linkding/blob/master/README.md)**. What I really like about it, it allows you to save your bookmarks, assign tags to it to search for it later, it has chrome and firefox browser extensions, and comes with an API.

## Installing Linkding

We will be using Traefik to do SSL termination and host based routing, if you don’t have Traefik running already, you can follow this post to get that set up:

- https://containers.fan/posts/setup-traefik-v2-docker-compose/

You can follow the [linkding documentation](https://github.com/sissbruecker/linkding/blob/master/README.md) for more detailed information.

The `docker-compose.yml` that I will be use:

```yaml
version: "3.8"

services:
  linkding:
    image: sissbruecker/linkding:latest
    container_name: linkding
    volumes:
      - ./data:/etc/linkding/data
    environment:
      - LD_DISABLE_BACKGROUND_TASKS=False
      - LD_DISABLE_URL_VALIDATION=False
    restart: unless-stopped
    cpus: 0.5
    mem_limit: 512m
    networks:
      - public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.linkding-app.rule=Host(`linkding.yourdomain.net`)"
      - "traefik.http.routers.linkding-app.entrypoints=https"
      - "traefik.http.routers.linkding-app.tls.certresolver=letsencrypt"
    logging:
      driver: "json-file"
      options:
        max-size: "1m"

networks:
  public:
    name: public
```

Make sure to replace the FQDN of your choice, as I used `linkding.yourdomain.net` as an example.

Once everything is in place, boot the stack:

```bash
docker-compose up -d
```

## Admin Account Registration

Once your linkding container has booted, you can create a admin user with the following command (ensure to replace where needed):

```bash
docker-compose exec linkding python manage.py createsuperuser --username=admin --email=root@localhost
```

Once you head over to the linkding url that you provided and you logon, you should be able to see something like this:

![linkding](https://user-images.githubusercontent.com/567298/171265323-2b23515f-8535-4c89-a195-6ab9b63eab68.png)

## Creating Bookmarks

When you select "Add Bookmark" and you provide the URL, linkding will retrieve the title and the description and populate it for you, and you can provide the tags (seperated by spaces):

![linkding-bookmark](https://user-images.githubusercontent.com/567298/171266278-ab31afc0-4aca-48fc-9795-4d49ae9b3508.png)

## Browser Extensions

To add a browser extension, select "Settings", then "Integrations", then you will find the link to the browser extension for Chrome and Firefox:

![linkding-browser-extension](https://user-images.githubusercontent.com/567298/171266713-3e2b2e5d-2ff0-43be-9713-5dd69a15d0cd.png)

After you install the browser extension and click on it for the first time, it will ask you to set the Linkding Base URL and API Authentication Token:

![linkding-configuration](https://user-images.githubusercontent.com/567298/171267455-123cad06-3758-4991-bb7e-40dc43a62996.png)

You can find that at the bottom of the "Integrations" section:

![linkding-rest-api-access](https://user-images.githubusercontent.com/567298/171269639-45e65ab0-b413-4879-9c8f-0b82f5884096.png)

## REST API

You can follow the [API Docs](https://github.com/sissbruecker/linkding/blob/master/docs/API.md) for more information, using an example to search for bookmarks with the term "docker":

```bash
curl -sL -H "Authorization: Token ${LINKDING_API_TOKEN}" "https://linkding.${DOMAIN}/api/bookmarks?q=docker" | python3 -m json.tool
```

In my case returns a response like the following:

```json
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 6,
            "url": "https://www.docker.com/blog/deploying-web-applications-quicker-and-easier-with-caddy-2/",
            "title": "",
            "description": "",
            "website_title": "Deploying Web Applications Quicker and Easier with Caddy 2 - Docker",
            "website_description": "Deploying web apps can be tough, even with leading server technologies. Learn how you can use Caddy 2 and Docker simplify this process.",
            "is_archived": false,
            "tag_names": [
                "caddy",
                "docker"
            ],
            "date_added": "2022-05-31T19:11:53.739002Z",
            "date_modified": "2022-05-31T19:11:53.739016Z"
        }
    ]
}
```

## Thank You

Thanks for reading, feel free to check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
