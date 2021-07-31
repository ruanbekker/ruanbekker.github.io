---
layout: post
title: "Basic Logging with Python"
date: 2021-07-31 04:17:24 -0400
comments: true
categories: ["python", "logging"] 
---

![](https://blog.ruanbekker.com/images/ruanbekker-header-photo.png)

I'm trying to force myself to move away from using the `print()` function as I'm pretty much using print all the time to cater for logging, and using the `logging` package instead.

This is a basic example of using logging in a basic python app:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

messagestring = {'info': 'info message', 'warn': 'this is a warning', 'err': 'this is a error'}

logger = logging.getLogger('thisapp')
logger.info('message: {}'.format(messagestring['info']))
logger.warning('message: {}'.format(messagestring['warn']))
logger.error('message: {}'.format(messagestring['err']))
```

When running this example, this is the output that you will see:

```bash
$ python app.py
2021-07-19 13:07:43,647 [INFO] thisapp message: info message
2021-07-19 13:07:43,647 [WARNING] thisapp message: this is a warning
2021-07-19 13:07:43,647 [ERROR] thisapp message: this is a error
```

More more info on this package, see it's documentation:
- https://docs.python.org/3/library/logging.html

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.
