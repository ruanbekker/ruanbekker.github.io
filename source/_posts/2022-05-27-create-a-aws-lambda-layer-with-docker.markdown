---
layout: post
title: "Create a AWS Lambda Layer with Docker"
date: 2022-05-27 06:19:05 -0400
comments: true
categories: ["aws", "lambda", "docker", "devops"]
---

In this tutorial we will be creating a AWS Lambda Python [Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) that will include the Python Requests package and we will compile the package with Docker and the LambCI image.

## Getting Started

First we will create the directory where we will store the intermediate data:

```bash
$ mkdir lambda-layers
$ cd lambda-layers
```

Then we will create the directory structure, as you can see I will be using the python 3.8 runtime:

```bash
$ mkdir -p requests/python/lib/python3.8
$ cd requests
```

Write the dependencies to the requirements file:

```bash
$ echo "requests" > requirements.txt
```

Install dependencies locally using docker, where we will be using the `lambci/lambda:build-python3.8` iamge and we are mounting our current working directory to `/var/task` inside the container, and then we will be running the command `pip install -r requirements.txt -t python/lib/python3.7/site-packages/; exit` inside the container, which will essentially dump the content to our working directory:

```bash
$ docker run -v $PWD:/var/task \
   lambci/lambda:build-python3.8 \
   sh -c "pip install -r requirements.txt -t python/lib/python3.8/site-packages/; exit"
```

Zip up the deployment package that we will push to AWS Lambda Layers:

```bash
$ zip -r package.zip python > /dev/null
```

Publish the layer using the aws cli tools, by specifying the deployment package, the compatible runtime and a identifier:

```bash
$ aws --profile dev lambda \
   publish-layer-version --layer-name python-requests \
   --description "Python Requests using 3.8 Runtime" \
   --zip-file fileb://package.zip \
   --compatible-runtime "python3.8"
```

Then when you want to reference the layer on the functio that you want to create, you can do it like this:

```bash
$ aws lambda create-function --function-name test-requests \
   --runtime python3.8 \
   --handler lambda_function.lambda_handler \
   --role "" --layers "arn:aws:lambda:eu-west-1:xxxxxxxxxxxx:layer:test-requests" \
   --code "S3Bucket=string,S3Key=string"
```

## Thank You

Thanks for reading, if you like my content, check out my **[website](https://ruan.dev)**, read my **[newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog)** or follow me at **[@ruanbekker](https://twitter.com/ruanbekker)** on Twitter.

Credit to [oznetnerd.com](https://oznetnerd.com/2020/11/11/lambda-packaging-the-right-way/).
