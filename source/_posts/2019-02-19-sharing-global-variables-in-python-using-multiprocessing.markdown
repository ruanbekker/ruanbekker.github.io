---
layout: post
title: "Sharing Global Variables in Python using Multiprocessing"
date: 2019-02-19 09:02:43 -0500
comments: true
categories: ["python", "multiprocessing"] 
---

![](https://user-images.githubusercontent.com/567298/53020033-c51b9480-345e-11e9-9625-b73062e2464a.png)

While I was using multiprocessing, I found out that global variables are not shared between processes.

<a href="https://bekkerclothing.com/collections/developer?utm_source=blog.ruanbekker.com&utm_medium=blog&utm_campaign=leaderboard_ad" target="_blank"><img alt="bekker-clothing-developer-tshirts" src="https://user-images.githubusercontent.com/567298/70170981-7c278a80-16d6-11ea-9759-6621d02c1423.png"></a>

## Example of the Issue

Let me first provide an example of the issue that I was facing. 

I have 2 input lists, which 2 processes wil read from and append them to the final list and print the aggregated list to stdout

```python
import multiprocessing
final_list = []

input_list_one = ['one', 'two', 'three', 'four', 'five']
input_list_two = ['six', 'seven', 'eight', 'nine', 'ten']

def worker(data):
    for item in data:
        final_list.append(item)

process1 = multiprocessing.Process(target=worker, args=[final_list_one])
process2 = multiprocessing.Process(target=worker, args=[final_list_two])

process1.start()
process2.start()
process1.join()
process2.join()

print(final_list)
```

When running the example:

```bash
$ python3 mp_list_issue.py
[]
```

As you can see the response from the list is still empty. 

## Resolution

We need to use [multiprocessing.Manager.List](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.sharedctypes.multiprocessing.Manager). 

From Python's Documentation:

"The `multiprocessing.Manager` returns a started SyncManager object which can be used for sharing objects between processes. The returned manager object corresponds to a spawned child process and has methods which will create shared objects and return corresponding proxies."

```python
import multiprocessing
manager = multiprocessing.Manager()
final_list = manager.list()

input_list_one = ['one', 'two', 'three', 'four', 'five']
input_list_two = ['six', 'seven', 'eight', 'nine', 'ten']

def worker(data):
    for item in data:
        final_list.append(item)

process1 = multiprocessing.Process(target=worker, args=[final_list_one])
process2 = multiprocessing.Process(target=worker, args=[final_list_two])

process1.start()
process2.start()
process1.join()
process2.join()

print(final_list)
```

Now when we run our script, we can see that our processes are aware of our defined list:

```python
$ python3 mp_list.py
['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
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
