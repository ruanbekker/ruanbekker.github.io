---
layout: post
title: "Benchmark Website Response Times with CURL"
date: 2018-10-31 02:17:12 -0400
comments: true
categories: ["linux", "sysadmin", "benchmark", "curl"] 
---

We can gain insights when making requests to websites such as:

- Lookup time
- Connect time
- AppCon time
- Redirect time
- PreXfer time
- StartXfer time

We will make a request to a website that has caching enabled, the first hit will be a MISS:

```bash
$ curl -s -w '\nLookup time:\t%{time_namelookup}\nConnect time:\t%{time_connect}\nAppCon time:\t%{time_appconnect}\nRedirect time:\t%{time_redirect}\nPreXfer time:\t%{time_pretransfer}\nStartXfer time:\t%{time_starttransfer}\n\nTotal time:\t%{time_total}\n' -o /dev/null obj-cache.cloud.ruanbekker.com/elasticsearch-2.jpg

Lookup time:	1.524465
Connect time:	1.707561
AppCon time:	0.000000
Redirect time:	0.000000
PreXfer time:	1.707656
StartXfer time:	1.897660

Total time:	2.451824
```

The next hit will be a HIT:

```bash
$ curl -s -w '\nLookup time:\t%{time_namelookup}\nConnect time:\t%{time_connect}\nAppCon time:\t%{time_appconnect}\nRedirect time:\t%{time_redirect}\nPreXfer time:\t%{time_pretransfer}\nStartXfer time:\t%{time_starttransfer}\n\nTotal time:\t%{time_total}\n' -o /dev/null obj-cache.cloud.ruanbekker.com/elasticsearch-2.jpg

Lookup time:	0.004441
Connect time:	0.188065
AppCon time:	0.000000
Redirect time:	0.000000
PreXfer time:	0.188160
StartXfer time:	0.381344

Total time:	0.926420
```

Similar Posts:

- https://blog.josephscott.org/2011/10/14/timing-details-with-curl/
- https://ops.tips/gists/measuring-http-response-times-curl/
