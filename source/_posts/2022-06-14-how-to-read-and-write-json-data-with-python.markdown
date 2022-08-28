---
layout: post
title: "How to Read and Write json data with Python"
date: 2022-06-14 19:02:53 -0400
comments: true
categories: ["python"] 
featured: "https://ruan.dev/images/new-post-ruan-dev.png"
---

This is a short tutorial on how to use python to write and read files.

## Example

To write the following json data:

```json
{"name": "ruan"}
```

To a file named `/tmp/data.json`, we will be using this code:

```python
import json

data = {"name": "ruan"}
with open('data.json', 'w') as f:
    f.write(json.dumps(data))
```

When we execute that code, we will find the data inside that file:

```bash
$ cat /tmp/data.json
{"name": "ruan"}
```

And if we want to use python to read the data:

```python
import json

with open('data.json', 'r') as f:
    json.loads(f.read())
```

When we execute that code, we will see:

```json
{'name': 'ruan'}
```

## Thank You

Thanks for reading, feel free to check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.


