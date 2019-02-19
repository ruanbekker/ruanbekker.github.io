---
layout: post
title: "Parallel Processing on AWS Lambda with Python using Multiprocessing"
date: 2019-02-19 09:39:47 -0500
comments: true
categories: ["aws", "lambda", "python", "multiprocessing"] 
---

![](https://user-images.githubusercontent.com/567298/53020033-c51b9480-345e-11e9-9625-b73062e2464a.png)

If you are trying to use `multiprocessing.Queue` or `multiprocessing.Pool` on AWS Lambda, you are probably getting the exception:

```
[Errno 38] Function not implemented: OSError

    sl = self._semlock = _multiprocessing.SemLock(kind, value, maxvalue)
OSError: [Errno 38] Function not implemented
```

The reason for that is due to the Lambda execution environment not having support on shared memory for processes, therefore you can’t use `multiprocessing.Queue` or `multiprocessing.Pool`.

As a workaround, Lambda does support the usage of `multiprocessing.Pipe` instead of Queue.

## Parallel Processing on Lambda Example

Below is a very basic example on how you would achieve the task of executing parallel processing on AWS Lambda for Python:


```python
import time
import multiprocessing

region_maps = {
        "eu-west-1": {
            "dynamodb":"dynamodb.eu-west-1.amazonaws.com"
        },
        "us-east-1": {
            "dynamodb":"dynamodb.us-east-1.amazonaws.com"
        },
        "us-east-2": {
            "dynamodb": "dynamodb.us-east-2.amazonaws.com"
        }
    }

def multiprocessing_func(region):
    time.sleep(1)
    endpoint = region_maps[region]['dynamodb']
    print('endpoint for {} is {}'.format(region, endpoint))

def lambda_handler(event, context):
    starttime = time.time()
    processes = []
    regions = ['us-east-1', 'us-east-2', 'eu-west-1']
    for region in regions:
        p = multiprocessing.Process(target=multiprocessing_func, args=(region,))
        processes.append(p)
        p.start()

    for process in processes:
        process.join()

    output = 'That took {} seconds'.format(time.time() - starttime)
    print(output)
    return output
```

The output when the function gets invoked:

```
pid: 30913 - endpoint for us-east-1 is dynamodb.us-east-1.amazonaws.com
pid: 30914 - endpoint for us-east-2 is dynamodb.us-east-2.amazonaws.com
pid: 30915 - endpoint for eu-west-1 is dynamodb.eu-west-1.amazonaws.com
That took 1.014902114868164 seconds
```

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_ZA/i/scr/pixel.gif" width="1" height="1" />
</form>
</center>

<br>

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>
