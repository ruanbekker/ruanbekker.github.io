---
layout: post
title: "Concourse Tasks and Inputs Tutorial"
date: 2019-02-12 14:57:27 -0500
comments: true
categories: ["concourse", "devops", "ci", "automation"] 
---

![](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495)

In this tutorial I will show you how to execute task scripts and using task inputs to have the ability to pass data to concourse for processing.

For my other content on concourse, have a look at the [concourse](https://i.snag.gy/gzkdu9.jpg?nocache=1511644783495) category.

## Task Inputs

First, let's run a task on concourse that does not rely on any inputs.

```yaml no_inputs.yml
platform: linux

image_resource:
  type: docker-image
  source: {repository: busybox}

run:
  path: uname
args: ["-a"]
```

Running execute with the configuration from above:

```bash
$ fly -t ci e -c no_inputs.yml

executing build 37 at http://10.20.30.40/builds/37
initializing
running uname -a
Linux 2fd4e261-a708-4e15-4a4a-2bc50221a664 4.9.0-8-amd64 #1 SMP Debian 4.9.110-3+deb9u4 (2018-08-21) x86_64 GNU/Linux
succeeded
```

As you can see we have executed the command `uname -a` on one of the containers in Concourse.

## Tasks Inputs: Specify Path

Now lets say, we have data that needs to be transferred to the container where we are running our tasks. For that we are using inputs.

In this example, we will set the input parameter in our task definition, and override the path with the cli. We will create a couple of files in a folder, then list them in the container where the task is running.

Creating the data:

```bash
$ mkdir my-data-folder
$ touch my-data-folder/test1.txt my-data-folder/test2.txt
```

Our task definition:

```yaml inputs_required.yml
platform: linux

image_resource:
  type: docker-image
  source: {repository: busybox}

inputs:
- name: my-input

run:
  path: ls
  args: ['-alR']
```

As you can see our input name is called `my-input` and we will use the cli to map the local folder `my-data-folder` to the parameter name:

```bash
$ fly -t ci e -c inputs_required.yml -i my-input=./my-data-folder/

executing build 32 at http://10.20.30.40/builds/32
initializing
my-input: 262.13 KiB/s 0s
running ls -alR
.:
total 0
drwxr-xr-x    1 root     root            16 Feb 10 08:53 .
drwxr-xr-x    1 root     root            16 Feb 10 08:53 ..
drwxr-xr-x    1 root     root            36 Feb 10 08:53 my-input

./my-input:
total 0
drwxr-xr-x    1 root     root            36 Feb 10 08:53 .
drwxr-xr-x    1 root     root            16 Feb 10 08:53 ..
-rw-r--r--    1 501      staff            0 Feb 10 08:52 test1.txt
-rw-r--r--    1 501      staff            0 Feb 10 08:52 test2.txt
succeeded
```

As you can see from the above output, the folder was uploaded and placed inside the container where we ran our task.

## Task Inputs: Parent Directory

Then we can use parent directories. Running a task that relies on the input path which will be our current working directory. Note: the input name should be the same as the current working directory

The input name will be the only thing that differs, which will look like:

```
inputs:
- name: my-data-folder
```

Running the task:

```bash
$ cd my-data-folder
$ fly -t ci e -c ../input_parent_dir.yml

executing build 35 at http://10.20.30.40/builds/35
initializing
my-data-folder: 395.85 KiB/s 0s
running ls -alR
.:
total 0
drwxr-xr-x    1 root     root            38 Feb 10 09:17 .
drwxr-xr-x    1 root     root            16 Feb 10 09:17 ..
drwxr-xr-x    1 root     root            18 Feb 10 09:17 my-data-folder

./my-data-folder:
total 0
drwxr-xr-x    1 root     root            18 Feb 10 09:17 .
drwxr-xr-x    1 root     root            38 Feb 10 09:17 ..
-rw-r--r--    1 501      staff            0 Feb 10 09:15 test1.txt
-rw-r--r--    1 501      staff            0 Feb 10 09:15 test2.txt
succeeded 
```

The source code for this can be found at [https://github.com/ruanbekker/concourse-tutorial/tree/master/02-task-inputs](https://github.com/ruanbekker/concourse-tutorial/tree/master/02-task-inputs)

## Task Scripts:

In conjunction with inputs, we can let our task configuration reference a script that we want to execute, and using inputs, we can upload the current working directory to concourse, so then the container has context about the data that it needs.

Our task configuration `task_show_hostname.yml`

```bash
platform: linux

image_resource:
  type: docker-image
  source: {repository: busybox}

inputs:
- name: 03-task-scripts

run:
  path: ./03-task-scripts/task_show_hostname.sh
```

Our executable script `03-task-scripts/task_show_hostname.sh`

```bash
#!/bin/sh

get_hostname=$(hostname)
echo "Hostname is: ${get_hostname}"
```

Make sure to apply the executable permissions to the script:

```bash
$ chmod +x 03-task-scripts/task_show_hostname.sh
```

With this configuration, it uploads the current working directory to concourse, and the data inside the directory gets placed on the container's working directory: 03-task-scripts, which is the name of the input.

```bash
$ fly -t ci e -c 03-task-scripts/task_show_hostname.yml

executing build 39 at http://10.20.30.40/builds/39
initializing
03-task-scripts: 347.15 KiB/s 0s
running ./03-task-scripts/task_show_hostname.sh
Hostname is: 3ccb3c28-d452-4068-5ea1-101153803d93
succeeded
```

The source code for this example can be found at [https://github.com/ruanbekker/concourse-tutorial/tree/master/03-task-scripts](https://github.com/ruanbekker/concourse-tutorial/tree/master/03-task-scripts)

That's it for Task Inputs and Task Scripts on Concourse, please feel free to have a look at my other content about [Concourse](http://blog.ruanbekker.com/blog/categories/concourse/)
