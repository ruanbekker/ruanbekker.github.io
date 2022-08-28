---
layout: post
title: "Using Python RQ for Task Queues in Python"
description: "Python Redis Queue Getting Started Tutorial by Ruan Bekker"
#image: "images/blog-ruanbekker-header.png"
date: 2020-05-16 21:12:36 +0200
comments: true
categories: ["redis", "python", "python-rq", "task-queues"]
keywords: "python, redis, python-rq, docker, asynchronous, blog, ruanbekker"
---

This is a getting started on python-rq tutorial and I will demonstrate how to work with asynchronous tasks using python redis queue (python-rq).

## What will we be doing

We want a client to submit 1000's of jobs in a non-blocking asynchronous fashion, and then we will have workers which will consume these jobs from our redis queue, and process those tasks at the rate of what our consumer can handle.

The nice thing about this is that, if our consumer is unavailable for processing the tasks will remain in the queue and once the consumer is ready to consume, the tasks will be executed. It's also nice that its asynchronous, so the client don't have to wait until the task has finished.

We will run a redis server using docker, which will be used to queue all our jobs, then we will go through the basics in python and python-rq such as:

- Writing a Task
- Enqueueing a Job
- Getting information from our queue, listing jobs, job statuses
- Running our workers to consume from the queue and action our tasks
- Basic application which queues jobs to the queue, consumes and action them and monitors the queue

## Redis Server

You will require docker for this next step, to start the redis server:

```
$ docker run --rm -itd --name redis -p 6379:6379 redis:alpine
```

## Python RQ

Install python-rq:

```
$ pip install rq
```

Create the task which will be actioned by our workers, in our case it will just be a simple function that adds all the numbers from a given string to a list, then adds them up and return the total value.

This is however a very basic task, but its just for demonstration.

Our `tasks.py`:

```
def sum_numbers_from_string(string):
    numbers = []
    for each_character in string:
        if each_character.isdigit():
            numbers.append(int(each_character))
    total = 0
    for each_number in numbers:
        total=total+each_number

    return total
```

To test this locally:

```
>>> from tasks import sum_numbers_from_string
>>> sum_numbers_from_string('adje-fje5-sjfdu1s-gdj9-asd1fg')
16
```

Now, lets import redis and redis-queue, with our tasks and instantiate a queue object:

```
>>> from redis import Redis
>>> from rq import Connection, Queue, Worker
>>> from tasks import sum_numbers_from_string
>>> redis_connection = Redis(host='localhost', port=6379, db=0)
>>> q = Queue(connection=redis_connection)
```

## Submit a Task to the Queue

Let's submit a task to the queue:

```
>>> result = q.enqueue(sum_numbers_from_string, 'hbj2-plg5-2xf4r1s-f2lf-9sx4ff')
```

We have a couple of properties from `result` which we can inspect, first let's have a look at the id that we got back when we submitted our task to the queue:

```
>>> result.get_id()
'5a607474-cf1b-4fa5-9adb-f8437555a7e7'
```

We can also get the status from our task:

```
>>> result.get_status()
'queued'
```

We can also view our results in json format:

```
>>> import json
>>> print(json.dumps(result.to_dict(), indent=2, default=str))
{
  "created_at": "2020-05-16T11:56:49.892713Z",
  "data": "b'..\\x00\\x99\\xa0\\x16\\xfe..'",
  "origin": "default",
  "description": "tasks.sum_numbers_from_string('hbj2-plg5-2xf4r1s-f2lf-9sx4ff')",
  "enqueued_at": "2020-05-16T11:56:49.893252Z",
  "started_at": "",
  "ended_at": "",
  "timeout": 180,
  "status": "queued"
}
```

If we dont have context of the job id, we can use `get_jobs` to get all the jobs which is queued:

```
>>> list_jobs = q.get_jobs
>>> list_jobs()
[Job('5a607474-cf1b-4fa5-9adb-f8437555a7e7', enqueued_at=datetime.datetime(2020, 5, 16, 12, 30, 22, 699609))]
```

Then we can loop through the results and get the id like below:

```
>>> for j in list_jobs():
...     j.id
...
'5a607474-cf1b-4fa5-9adb-f8437555a7e7'
```

Or to get the job id's in a list:

```
>>> list_job_ids = q.get_job_ids()
>>> list_job_ids
['5a607474-cf1b-4fa5-9adb-f8437555a7e7']
```

Since we received the job id, we can use `fetch_job` to get more info about the job:

```
>>> fetched_job = q.fetch_job('5a607474-cf1b-4fa5-9adb-f8437555a7e7')
>>> fetched_job
Job('5a607474-cf1b-4fa5-9adb-f8437555a7e7', enqueued_at=datetime.datetime(2020, 5, 16, 12, 30, 22, 699609))
```

And as before we can view it in json format:

```
>>> fetched_job.to_dict()
{'created_at': '2020-05-16T12:30:22.698728Z', 'data': b'..x\x9c6\xfe..', 'origin': 'queue1', 'description': "tasks.sum_numbers_from_string('hbj2-plg5-2xf4r1s-f2lf-9sx4ff')", 'enqueued_at': '2020-05-16T12:30:22.699609Z', 'started_at': '', 'ended_at': '', 'timeout': 180, 'status': 'queued'}
```

We can also view the key in redis by passing the job_id:

```
>>> result.key_for(job_id='5a607474-cf1b-4fa5-9adb-f8437555a7e7')
b'rq:job:5a607474-cf1b-4fa5-9adb-f8437555a7e7'
```

To view how many jobs are in our queue, we can either do:

```
>>> len(q)
1
```

or:

```
>>> q.get_job_ids()
['5a607474-cf1b-4fa5-9adb-f8437555a7e7']
```

## Consuming from the Queue

Now that our task is queued, let's fire of our worker to consume the job from the queue and action the task:

```
>>> w = Worker([q], connection=redis_connection)
>>> w.work()
14:05:35 Worker rq:worker:49658973741d4085961e34e9641227dd: started, version 1.4.1
14:05:35 Listening on default...
14:05:35 Cleaning registries for queue: default
14:05:35 default: tasks.sum_numbers_from_string('hbj2-plg5-2xf4r1s-f2lf-9sx4ff') (5a607474-cf1b-4fa5-9adb-f8437555a7e7)
14:05:40 default: Job OK (5a607474-cf1b-4fa5-9adb-f8437555a7e7)
14:05:40 Result is kept for 500 seconds
14:05:59 Warm shut down requested
True
```

Now, when we get the status of our job, you will see that it finished:

```
>>> result.get_status()
'finished'
```

And to get the result from our worker:

```
>>> result.result
29
```

And like before, if you dont have context of your job id, you can get the job id, then return the result:

```
>>> result = fetched_job = q.fetch_job('5a607474-cf1b-4fa5-9adb-f8437555a7e7')
>>> result.result
29
```

## Naming Queues

We can namespace our tasks into specific queues, for example if we want to create `queue1`:

```
>>> q1 = Queue('queue1', connection=redis_connection)
```

To verify the queue name:

```
>>> q1
Queue('queue1')
```

As we can see our queue is empty:

```
>>> q1.get_job_ids()
[]
```

Let's submit 10 jobs to our queue:

```
>>> from uuid import uuid4
>>> for attempt in range(0,10):
...     random_string = uuid4().hex
...     q1.enqueue(sum_numbers_from_string, random_string)
...
Job('c3f2369d-5b27-40e0-97be-8fe26989a78e', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 472508))
Job('06b93517-5dae-4133-8131-e8d35b8dd780', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 475604))
Job('81f05aef-4bd6-421b-912d-78b5d419b10a', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 478071))
Job('8f14e81f-74fa-44d9-9fc7-e8e7b8c7b76f', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 480438))
Job('e8552750-89d2-4538-8c3e-a48c4c3e9a51', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 483106))
Job('bf19a0a3-eb0c-4692-b452-67c5ad954094', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 486193))
Job('0da3688a-cffa-4ba6-a272-b6cc90942ef6', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 488545))
Job('717bd147-615c-458d-8386-9ea6a198e137', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 491074))
Job('7cdac5aa-8dc3-40be-a8fc-b273ce61b03b', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 493618))
Job('4f7ea527-0695-4e2b-bc8b-3d8807a86390', enqueued_at=datetime.datetime(2020, 5, 16, 13, 1, 14, 496930))
```

To verify the number of jobs in our queue:

```
>>> q1.get_job_ids()
['c3f2369d-5b27-40e0-97be-8fe26989a78e', '06b93517-5dae-4133-8131-e8d35b8dd780', '81f05aef-4bd6-421b-912d-78b5d419b10a', '8f14e81f-74fa-44d9-9fc7-e8e7b8c7b76f', 'e8552750-89d2-4538-8c3e-a48c4c3e9a51', 'bf19a0a3-eb0c-4692-b452-67c5ad954094', '0da3688a-cffa-4ba6-a272-b6cc90942ef6', '717bd147-615c-458d-8386-9ea6a198e137', '7cdac5aa-8dc3-40be-a8fc-b273ce61b03b', '4f7ea527-0695-4e2b-bc8b-3d8807a86390']
```

And to count them:

```
>>> len(q1)
10
```

## Cleaning the Queue

Cleaning the queue can either be done with:

```
>>> q.empty()
10
```

or

```
>>> q.delete(delete_jobs=True)
```

Then to verify that our queue is clean:

```
>>> q.get_job_ids()
[]
```

## Naming Workers

The same way that we defined a name for our queue, we can define a name for our workers:

```
>>> worker = Worker([q1], connection=redis_connection, name='worker1')
>>> worker.work()
```

Which means you can have different workers consuming jobs from specific queues.

## Resources

Documentation:

- https://python-rq.org/docs/
- https://python-rq.org/docs/workers/
- https://python-rq.org/docs/monitoring/

## Thank You

I hope this was usful, if you enjoyed this come say hi on Twitter [@ruanbekker](https://twitter.com/ruanbekker) or visit my website at [ruan.dev](https://ruan.dev)
