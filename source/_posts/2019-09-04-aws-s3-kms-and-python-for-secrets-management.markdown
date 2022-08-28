---
layout: post
title: "AWS S3 KMS and Python for Secrets Management"
date: 2019-09-04 19:58:45 +0200
comments: true
categories: ["aws", "s3", "kms", "python"] 
---

![](https://miro.medium.com/max/2400/1*9PSzVZDHjr321CpxJHcxPQ.png)

So your application need to store secrets and you are looking for a home for them. In this tutorial we will see how we can use Python, S3 and KMS to build our own solution for managing secrets.

There is SSM and Secrets Manager that probably does a better job, but my mind got curious :D

## High Level Goal

From a High-Level we want to store secrets encrypted on S3 with KMS, namespaced with **team/application/environment/value** in json format so that our application receives the json dictionary of configured key/value pairs.

We can leverage **IAM** to delegate permissions on the namespacing that we decide on, for my example the namespace will look like this on S3:

```
s3://s3bucket/secrets/engineering/app1/production/appconfig.json
```

We will apply **IAM** permissions for our user to only **Put** and **Get** on `secrets/engineering*`. So with this idea we can apply IAM permissions on groups for different departments, or even let users manage their own secrets such as:

```
s3://s3bucket/secrets/personal/user.name/app/appconfig.json
```

After the object has been downloaded from S3 and decrypted using KMS, the value of the object will look like this:

```
{u'surname': u'bekker', u'name': u'ruan', u'job_title': u'systems-development-engineer'}
```

## Requirements

We will create the following resources on AWS:

* KMS Key
* S3 Bucket
* IAM User
* IAM Policy
* Python Dependencies: Boto3

## Provision AWS Resources

![](https://miro.medium.com/max/2728/1*Lq9xaUXuNo2Nb8kQakYdsg.png)

First we will create our **S3 Bucket**,  head over to [Amazon S3](https://s3.console.aws.amazon.com/s3/home?region=eu-west-1) create a new s3 bucket, make sure that the bucket is **NOT** public, by using the default configuration, you should be good.

Once your S3 Bucket is provisioned, head over to [Amazon IAM](https://console.aws.amazon.com/iam/home#/users) and create a IAM User, enable programmatic access, and keep your access key and secret key safe. For now we will not apply any permissions as we will come back to this step.

Head over to [Amazon KMS](https://eu-west-1.console.aws.amazon.com/kms/home?region=eu-west-1#/kms/home) and create a KMS Key, we will define the **key administrator**, which will be my user (ruan.bekker in this case) with more privileged permissions:

![](https://miro.medium.com/max/5120/1*EUPWbCQ8nsfbBWHQI6srYw.png)

and then we will define the **key usage permissions** (app.user in this case), which will be the user that we provisioned from the previous step, this will be the user that will encrypt and decrypt the data:

![](https://miro.medium.com/max/5120/1*5xA5H0qpJ1FYTG1hUjy_Tw.png)

Next, review the policy generated from the previous selected sections:

![](https://miro.medium.com/max/5120/1*bLDVPFaZUDQ4EyWjACYRUw.png)

Once you select finish, you will be returned to the section where your KMS Key information will be displayed, keep note of your **KMS Key Alias**, as we will need it later:

![](https://miro.medium.com/max/5120/1*aooUMS0OyEd5hopnOUrcmA.png)

## Create a IAM Policy for our App User

Next we will create the IAM Policy for the user that will encrypt/decrypt and store data in S3

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3PutAndGetAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::arn:aws:s3:::s3-bucket-name/secrets/engineering*"
        },
        {
            "Sid": "KMSDecryptAndEncryptAccess",
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt",
                "kms:Encrypt"
            ],
            "Resource": "arn:aws:kms:eu-west-1:123456789012:key/xxxx-xxxx-xxxx-xxxx-xxxx"
        }
    ]
}
```

After the policy has been saved, associate the policy to the IAM User

## Encrypt and Put to S3

Now we will use Python to define the data that we want to **store in S3**, we will then **encrypt** the data with **KMS**, use base64 to **encode** the ciphertext and push the encrypted value to **S3**, with Server Side Encryption enabled, which we will also use our KMS key.

Install boto3 in Python:

```bash
$ pip install boto3
```

Enter the Python REPL and import the required packages, we will also save the access key and secret key as variables so that we can use it with boto3. You can also save it to the [credential provider](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/configuration.html) and utilise the profile name:

```python
>>> import boto3
>>> import json
>>> import base64
>>> aws_access_key_id='redacted'
>>> aws_secret_access_key='redacted'
```

Next define the data that we want to **encrypt and store** in S3:

```python
>>> mydata = {
    "name": "ruan",
    "surname": "bekker",
    "job_title": "systems-development-engineer"
}
```

Next we will use KMS to encrypt the data and use base64 to encode the ciphertext:

```python
>>> kms = boto3.Session(
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key
).client('kms')
>>> ciphertext = kms.encrypt(
    KeyId='alias/secrets-key',
    Plaintext=json.dumps(mydata)
)
>>> encoded_ciphertext = base64.b64encode(ciphertext["CiphertextBlob"])
# preview the data
>>> encoded_ciphertext
'AQICAHiKOz...42720nCleoI26UW7P89lPdwvV8Q=='
```

Next we will use S3 to push the encrypted data onto S3 in our name spaced key: **secrets/engineering/app1/production/appconfig.json**

```python
>>> s3 = boto3.Session(
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name='eu-west-1'
).client('s3')
>>> response = s3.put_object(
    Body=encoded_ciphertext,
    Bucket='ruan-secret-store',
    Key='secrets/engineering/app1/production/appconfig.json',
    ServerSideEncryption='aws:kms',
    SSEKMSKeyId='alias/secrets-key'
)
```

Now our object is stored in S3, encrypted with KMS and ServerSideEncryption Enabled.

You can try to download the object and decode the base64 encoded file and you will find that its complete garbage as its encrypted.

Next we will use S3 to Get the object and use KMS to decrypt and use base64 to decode after the object has been decrypted:

```python
>>> response = s3.get_object(
    Bucket='ruan-secret-store',
    Key='secrets/engineering/app1/production/appconfig.json'
)
>>> encoded_ciphertext = response['Body'].read()
>>> encoded_ciphertext
'AQICAHiKOz...42720nCleoI26UW7P89lPdwvV8Q=='
```

Now let’s decode the result with base64:

```python
>>> decoded_ciphertext = base64.b64decode(encoded_ciphertext)
>>> plaintext = kms.decrypt(CiphertextBlob=bytes(decoded_ciphertext))
```

Now we need to deserialize the JSON as it’s in string format:

```
>>> json.loads(plaintext["Plaintext"])
{u'surname': u'bekker', u'name': u'ruan', u'job_title': u'systems-development-engineer'}
```

## Using it in a Application

Let’s say you are using **Docker** and you want to bootstrap your application configs to your environment that you are retrieving from S3.

We will use a `get_secrets.py` python script that will read the data into memory, decrypt and write the values in plaintext to disk, then we will use the `boot.sh` script to read the values into the environment and remove the temp file that was written to disk, then start the application since we have the values stored in our environment.

Our **"application"** in this example will just be a line of echo to return the values for demonstration.

The `get_secrets.py` file:

```python
import boto3
import json
import base64

aws_access_key_id='redacted'
aws_secret_access_key='redacted'

kms = boto3.Session(aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key).client('kms')
s3 = boto3.Session(aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key, region_name='eu-west-1').client('s3')

response = s3.get_object(Bucket='ruan-secret-store', Key='secrets/engineering/app1/production/appconfig.json')
encoded_ciphertext = response['Body'].read()

decoded_ciphertext = base64.b64decode(encoded_ciphertext)
plaintext = kms.decrypt(CiphertextBlob=bytes(decoded_ciphertext))
values = json.loads(plaintext["Plaintext"])

with open('envs.tmp', 'w') as f:
    for key in values.keys():
        f.write("{}={}".format(key.upper(), values[key]) + "\n")
```

And our `boot.sh` script:

```bash
#!/usr/bin/env bash
source ./envs.tmp
rm -rf ./envs.tmp
echo "Hello, my name is ${NAME} ${SURNAME}, and I am a ${JOB_TITLE}"
```

Running that will produce:

```
$ bash boot.sh
Hello, my name is ruan bekker, and I am a systems-development-engineer
```

## Thank You

And there we have a simple and effective way of encrypting/decrypting data using S3, KMS and Python at a ridiculously cheap cost, its almost free.

If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**
