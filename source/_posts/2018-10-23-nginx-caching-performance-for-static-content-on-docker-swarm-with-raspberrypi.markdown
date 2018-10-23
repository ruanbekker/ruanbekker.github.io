---
layout: post
title: "Nginx Caching Performance for Static Content on Docker Swarm with RaspberryPi"
date: 2018-10-23 16:41:41 -0400
comments: true
categories: ["raspberrypi", "docker", "nginx", "caching", "performance"] 
---

![](https://objects.ruanbekker.com/assets/images/nginx-logo.png)


## The Environment:

I had my Ghost Blog listening on port 2368 and exposing port 80 on Docker so that the port translation directs port 80 traffic to port 2368 on Ghost directly.

Alex responded on my tweet and introduced Nginx Caching:

- https://twitter.com/alexellisuk/status/882347698636165121

![](https://objects.ruanbekker.com/assets/images/tweet-alexellis-04072017.png)

With this approach benchmarking results was not so great in terms of requests per second, and as this hostname will be only used for a blog, its a great idea to cache the content, this was achieved with the help from Alex's blog: [blog.alexellis.io/save-and-boost-with-nginx/](https://blog.alexellis.io/save-and-boost-with-nginx/)

## How Nginx was Configured:

I have a [blogpost](http://rbkr.ddns.net/building-nginx-on-alpine-image-for-docker-swarm-with-caching-enabled-config/) on how I setup Nginx on an Alpine Image, where I setup caching and proxy-pass the connections through to my ghost blog.

## Benchmarking: Before Nginx with Caching was Implemented:

When doing an apache benchmark I got <b>9.31 requests per second</b> performing the test on my LAN:

```bash
$ ab -n 500 -c 10 http://rbkr.ddns.net/

This is ApacheBench, Version 2.3 <$Revision: 1706008 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking rbkr.ddns.net (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Finished 500 requests


Server Software:
Server Hostname:        blog.pistack.co.za
Server Port:            80

Document Path:          /
Document Length:        5470 bytes

Concurrency Level:      10
Time taken for tests:   53.725 seconds
Complete requests:      500
Failed requests:        0
Total transferred:      2863000 bytes
HTML transferred:       2735000 bytes
Requests per second:    9.31 [#/sec] (mean)
Time per request:       1074.501 [ms] (mean)
Time per request:       107.450 [ms] (mean, across all concurrent requests)
Transfer rate:          52.04 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        1    2   0.5      2       6
Processing:   685 1068  68.7   1057    1306
Waiting:      683 1067  68.6   1056    1306
Total:        689 1070  68.7   1058    1312

Percentage of the requests served within a certain time (ms)
  50%   1058
  66%   1088
  75%   1102
  80%   1110
  90%   1163
  95%   1218
  98%   1240
  99%   1247
 100%   1312 (longest request)
```

## Benchmarking: After Nginx Caching was Implemented:

After Nginx Caching was Implemented, I got <b>1067.73 requests per second</b> using apache benchmark over a LAN connection! Absolutely awesome!

```bash
$ ab -n 500 -c 10 http://blog.pistack.co.za/
This is ApacheBench, Version 2.3 <$Revision: 1706008 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking blog.pistack.co.za (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Finished 500 requests


Server Software:        nginx
Server Hostname:        blog.pistack.co.za
Server Port:            80

Document Path:          /
Document Length:        5470 bytes

Concurrency Level:      10
Time taken for tests:   0.468 seconds
Complete requests:      500
Failed requests:        0
Total transferred:      2880500 bytes
HTML transferred:       2735000 bytes
Requests per second:    1067.73 [#/sec] (mean)
Time per request:       9.366 [ms] (mean)
Time per request:       0.937 [ms] (mean, across all concurrent requests)
Transfer rate:          6007.05 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        3    4   1.4      4      10
Processing:     3    5   1.6      4      10
Waiting:        2    4   1.6      4      10
Total:          6    9   2.7      8      17

Percentage of the requests served within a certain time (ms)
  50%      8
  66%      8
  75%      9
  80%      9
  90%     15
  95%     15
  98%     15
  99%     16
 100%     17 (longest request)
```

## Resources:

Thanks to Alex Ellis for the suggestion on this, and definitely have a look at [blog.alexellis.io](https://blog.alexellis.io/tag/nginx/) as he has some epic content on his blog!
