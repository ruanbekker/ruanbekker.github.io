---
layout: post
title: "Dockerizing a Memcached Server for Docker on Alpine"
date: 2018-09-01 16:01:09 -0400
comments: true
categories: ["caching", "memcached", "docker", "alpine"] 
---

![](https://objects.ruanbekker.com/assets/images/memcached-logo.png)

This post I will demostrate how to dockerize a memcached server on Alpine and how to create a boot script that allows you to pass environment variables through to the application.

## What is Memcached

Memcached is a multi-threaded, in-memory key/value store for small chunks of arbitrary data (strings, objects) from results of database calls, API calls, etc. More on [Memcached](https://memcached.org/about)

## The Dockerfile:

Our Dockerfile will consist of a simple install of memcached and add a boot script that we will start it from:

```docker
FROM alpine:3.7

COPY boot.sh /boot.sh
RUN apk --no-cache add memcached && chmod +x /boot.sh

USER memcached
CMD ["/boot.sh"]
```

## The Boot Script:

As you can see we have set defaults so when the user does not specify any environment variables, that it will inherit the default values

```bash
#!/bin/sh

/usr/bin/memcached \
  --user=${MEMCACHED_USER:-memcached} \
  --listen=${MEMCACHED_HOST:-0.0.0.0} \
  --port=${MEMCACHED_PORT:-11211} \
  --memory-limit=${MEMCACHED_MEMUSAGE:-64} \
  --conn-limit=${MEMCACHED_MAXCONN:-1024} \
  --threads=${MEMCACHED_THREADS:-4} \
  --max-reqs-per-event=${MEMCACHED_REQUESTS_PER_EVENT:-20} \
  --verbose
```

## Build and Deploy:

Build the image, if you just want to run the container you can use my public image in the next step:

```bash
$ docker build -t local/memcached:0.1 .
```

Run the Memcached Container:

```bash
$ docker run -itd --name memcached -p 11211:11211 -e MEMCACHED_MEMUSAGE=32 local/memcached:0.1
```

Or my Public Image from Docker Hub:

```bash
$ docker run -itd --name memcached -p 11211:11211 -e MEMCACHED_MEMUSAGE=32 rbekker87/memcached:alpine
```

## Check out the Stats:

Pass the command `stats` through the exposed port:

```
$ echo -e "stats" | nc localhost 11211                                                               
STAT pid 8
STAT uptime 2
STAT time 1535833177
STAT version 1.5.6
STAT libevent 2.1.8-stable
STAT pointer_size 64
STAT rusage_user 0.030000
STAT rusage_system 0.000000
STAT max_connections 1024
STAT curr_connections 1
STAT total_connections 2
STAT rejected_connections 0
STAT connection_structures 2
STAT reserved_fds 20
STAT cmd_get 0
STAT cmd_set 0
STAT cmd_flush 0
STAT cmd_touch 0
STAT get_hits 0
STAT get_misses 0
STAT get_expired 0
STAT get_flushed 0
STAT delete_misses 0
STAT delete_hits 0
STAT incr_misses 0
STAT incr_hits 0
STAT decr_misses 0
STAT decr_hits 0
STAT cas_misses 0
STAT cas_hits 0
STAT cas_badval 0
STAT touch_hits 0
STAT touch_misses 0
STAT auth_cmds 0
STAT auth_errors 0
STAT bytes_read 6
STAT bytes_written 0
STAT limit_maxbytes 33554432
STAT accepting_conns 1
STAT listen_disabled_num 0
STAT time_in_listen_disabled_us 0
STAT threads 4
STAT conn_yields 0
STAT hash_power_level 16
STAT hash_bytes 524288
STAT hash_is_expanding 0
STAT slab_reassign_rescues 0
STAT slab_reassign_chunk_rescues 0
STAT slab_reassign_evictions_nomem 0
STAT slab_reassign_inline_reclaim 0
STAT slab_reassign_busy_items 0
STAT slab_reassign_busy_deletes 0
STAT slab_reassign_running 0
STAT slabs_moved 0
STAT lru_crawler_running 0
STAT lru_crawler_starts 255
STAT lru_maintainer_juggles 155
STAT malloc_fails 0
STAT log_worker_dropped 0
STAT log_worker_written 0
STAT log_watcher_skipped 0
STAT log_watcher_sent 0
STAT bytes 0
STAT curr_items 0
STAT total_items 0
STAT slab_global_page_pool 0
STAT expired_unfetched 0
STAT evicted_unfetched 0
STAT evicted_active 0
STAT evictions 0
STAT reclaimed 0
STAT crawler_reclaimed 0
STAT crawler_items_checked 0
STAT lrutail_reflocked 0
STAT moves_to_cold 0
STAT moves_to_warm 0
STAT moves_within_lru 0
STAT direct_reclaims 0
STAT lru_bumps_dropped 0
END
```

Some descriptions:

`evictions` - when items are evicted from the cache
`total_items` - the number of items the server has stored since it was started
`current_items` - the number of items in the cache
`bytes` - the current number of bytes used to store items
`limit_maxbytes` - the number of bytes the server is allowed to use for storage
`get_misses` - the number of times a item has been requested, but not found
`get_hits` - the number of times a item has been served from the cache

To get specific stats, like evictions:

```bash
$ echo -e "stats" | nc localhost 11211 | grep -w evictions   
STAT evictions 0
```

When you see evictions value increases, this essentially means that memcache had to remove the oldest items from memory for new or more frequent used items. If this number remains high, consider increasing your memory allocated to memcache.

Slab Stats: returns information about each of the slabs created by memcached during runtime:

```bash
$ echo -e "stats slabs" | nc localhost 11211                 
STAT active_slabs 0
STAT total_malloced 0
```

`active_slabs` - Total number of slab classes allocated.
`total_malloced` - Total amount of memory allocated to slab pages.

For detailed description about statistics, have a look at their github resource:
- https://github.com/memcached/memcached/blob/master/doc/protocol.txt

## Resources:
- https://memcached.org/
- https://blog.serverdensity.com/monitor-memcached/
- https://wiki.mikejung.biz/Memcached
