---
layout: post
title: "Parallel Processing with Python and Multiprocessing using Queue"
date: 2019-02-19 08:05:47 -0500
comments: true
categories: ["python", "multiprocessing"] 
---

![](https://user-images.githubusercontent.com/567298/53020033-c51b9480-345e-11e9-9625-b73062e2464a.png)

Today I had the requirement to achieve a task by using parallel processing in order to save time.

## The task to be achieved

For this demonstration, I have a list of people and each task needs to lookup its pet name and return to stdout. I want to spawn a task for each persons pet name lookup and run the tasks in parallel so that all the results can be returned back at once, instead of sequential. 

This is a basic task, but you could have a CPU intensive job, where it will shine better.

## Multiprocesing Queues 

When using multiple processes, one generally uses message passing for communication between processes and avoids having to use any synchronization primitives like locks.

The Queue type is a multi producer, multi consumer FIFO queues modelled on the queue.Queue class in the standard library. You can read more up on it [here](https://docs.python.org/3.4/library/multiprocessing.html?highlight=process#pipes-and-queues)

## Our Workflow

Our multiprocessing workflow will look like this:

* We will define our data, which will be a dictionary of people and their pet names
* We will define an output queue
* Create a example function that will produce each task to the queue
* Then we will setup a lost of processes that we want to run
* From the list of processes that we defined, we will run each process, then wait and exit the completed processes
* We will then consume from the queue. For each process in our processes list

Note that I also added a delay of 2 seconds, so that you can see that the tasks are run in parallel, so the delay will only be 2 seconds.

Our code:

```python
import multiprocessing as mp
import random
import string
import time

pet_maps = {
        "adam": {"pet_name": "max"},
        "steve": {"pet_name": "sylvester"},
        "michelle": {"pet_name": "fuzzy"},
        "frank": {"pet_name": "pete"},
        "will": {"pet_name": "cat"},
        "natasha": {"pet_name": "tweety"},
        "samantha": {"pet_name": "bob"},
        "peter": {"pet_name": "garfield"},
        "susan": {"pet_name": "zazu"},
        "josh": {"pet_name": "tom"},
    }

pet_owners = pet_maps.keys()

output = mp.Queue()

def get_pet_name(data, output):
    time.sleep(2)
    print('adding to queue')
    response = 'pet name: {}'.format(data)
    output.put(response)

processes = [mp.Process(target=get_pet_name, args=(pet_maps[name]['pet_name'], output)) for name in pet_owners]

for p in processes:
    p.start()

for p in processes:
    p.join()

print('consuming from queue:')
results = [output.get() for p in processes]
print(results)
```

Running the example:

```python
$ python3 mp.py
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue
adding to queue

consuming from queue:
['pet name: max', 'pet name: sylvester', 'pet name: fuzzy', 'pet name: pete', 'pet name: cat', 'pet name: tweety', 'pet name: garfield', 'pet name: bob', 'pet name: zazu', 'pet name: tom']
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
