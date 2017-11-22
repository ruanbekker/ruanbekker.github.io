---
layout: post
title: "Update your Ghost Blog with the Ghost-CLI"
date: 2017-11-22 17:36:45 -0500
comments: true
categories: ["ghost", "blog", "nodejs"]
---

If you installed your Ghost Blog with the [Ghost-CLI](https://docs.ghost.org/docs/install), you can easily upgrade your Ghost version using the CLI.

## Backups

Backup your blog by exporting the json via the Ghost Admin Interface, and also update your content directory:

```bash
$ sudo su - ghost
$ cd /var/www/ghost
$ tar -zcf /home/ghost/backups/ghost-content-$(date +%F).tar.gz content
```

## Check the Current Version:

```bash
$ ghost status

Version:
1.17.0
```

## Update Ghost:

```bash
$ npm i -g ghost-cli
$ ghost update
```

## Verify Version:

```bash
$ ghost status

Version:
1.17.0
```

No need to restart Ghost as the update function restarted the process already.

## Resources:

- https://docs.ghost.org/docs/upgrade
