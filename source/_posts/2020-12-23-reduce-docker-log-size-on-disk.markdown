---
layout: post
title: "Reduce Docker Log Size on Disk"
date: 2020-12-23 04:11:35 -0500
comments: true
categories: ["docker", "docker-compose", "storage", "logs"]
---

In cases where you are using the defaults for logging and your application logs a lot you can consume a lot of disk space and you can run out of disk space quite quickly.

If it's a case where you already ran out of disk space, we can investigate the disk space consumed by docker logs:

```
$ cd /var/lib/docker/containers
$ du -sh *
6.0G	14052251a0f13f46f65bc73d10c01408130ee8ae71529600ba5bd6bee76af4ee
1.2G	e6b40b1d30c5cf05e8cb201ca9abf6bd283d7cf7ceaa3be2a0422be7cd750a33
```

Referenced from https://blog.birkhoff.me/devops-truncate-docker-container-logs-periodically-to-free-up-server-disk-space/ you can truncate those files:

```
$ sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'
```

Check the size again:

```
$ du -sh *
40K	14052251a0f13f46f65bc73d10c01408130ee8ae71529600ba5bd6bee76af4ee
36K	e6b40b1d30c5cf05e8cb201ca9abf6bd283d7cf7ceaa3be2a0422be7cd750a33
```

To overcome this issue you can use this in logging options in your compose:

```
...
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
...
```

