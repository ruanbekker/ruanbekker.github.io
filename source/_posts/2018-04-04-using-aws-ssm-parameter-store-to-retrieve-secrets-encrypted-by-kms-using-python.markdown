---
layout: post
title: "Using AWS SSM Parameter Store to Retrieve Secrets Encrypted by KMS using Python"
date: 2018-04-04 16:47:16 -0400
comments: true
categories: ["aws", "kms", "ssm", "secrets", "python", "boto3"] 
---

![](https://i.snag.gy/4ytE3W.jpg)

Today we will use Amazon Web Services SSM Service to store secrets in their Parameter Store which we will encyrpt using KMS. 

Then we will read the data from SSM and decrypt using our KMS key. We will then end it off by writing a Python Script that reads the AWS credentials, authenticates with SSM and then read the secret values that we stored.

## The Do List:

We will break up this post in the following topics:

- Create a KMS Key which will use to Encrypt/Decrypt the Parameter in SSM
- Create the IAM Policy which will be used to authorize the Encrypt/Decrypt by the KMS ID
- Create the KMS Alias
- Create the Parameter using PutParameter as a SecureString to use Encryption with KMS
- Describe the Parameters
- Read the Parameter with and without Decryption to determine the difference using GetParameter
- Read the Parameters using GetParameters
- Environment Variable Example

## Create the KMS Key:

As the administrator, or root account, create the KMS Key:

```python
>>> import boto3
>>> session = boto3.Session(region_name='eu-west-1', profile_name='personal')
>>> iam = session.client('iam')
>>> kms = session.client('kms')
>>> response = kms.create_key(
    Description='Ruan Test Key', 
    KeyUsage='ENCRYPT_DECRYPT', 
    Origin='AWS_KMS', 
    BypassPolicyLockoutSafetyCheck=False, 
    Tags=[{'TagKey': 'Name', 'TagValue': 'RuanTestKey'}]
)

>>> print(response['KeyMetadata']['KeyId'])
foobar-2162-4363-ba02-a953729e5ce6 
```

Create the IAM Policy:

```python
>>> response = iam.create_policy(
    PolicyName='ruan-kms-test-policy', 
    PolicyDocument='{
        "Version": "2012-10-17", 
        "Statement": [{
            "Sid": "Stmt1517212478199", 
            "Action": [
                "kms:Decrypt", 
                "kms:Encrypt"
            ], 
            "Effect": "Allow", 
            "Resource": "arn:aws:kms:eu-west-1:0123456789012:key/foobar-2162-4363-ba02-a953729e5ce6"
        }]
    }', 
    Description='Ruan KMS Test Policy'
)
>>> print(response['Policy']['Arn'])
arn:aws:iam::0123456789012:policy/ruan-kms-test-policy
```

Create the KMS Alias:

```python
>>> response = kms.create_alias(AliasName='alias/ruan-test-kms', TargetKeyId='foobar-2162-4363-ba02-a953729e5ce6')
```

## Publish the Secrets to SSM:

As the administrator, write the secret values to the parameter store in SSM. We will publish a secret with the Parameter: `/test/ruan/mysql/db01/mysql_hostname` and the Value: `db01.eu-west-1.mycompany.com`:

```python
>>> from getpass import getpass
>>> secretvalue = getpass()
Password:

>>> print(secretvalue)
db01.eu-west-1.mycompany.com

>>> response = ssm.put_parameter(
    Name='/test/ruan/mysql/db01/mysql_hostname', 
    Description='RuanTest MySQL Hostname', 
    Value=secretvalue, 
    Type='SecureString', 
    KeyId='foobar-2162-4363-ba02-a953729e5ce6', 
    Overwrite=False
)
```

## Describe Parameters

Describe the Parameter that we written to SSM:

```python
>>> response = ssm.describe_parameters(
    Filters=[{'Key': 'Name', 'Values': ['/test/ruan/mysql/db01/mysql_hostname']}]
)
>>> print(response['ResponseMetadata']['Parameters'][0]['Name'])
'/test/ruan/mysql/db01/mysql_hostname' 
```

## Reading from SSM:

Read the Parameter value from SSM without using decryption via KMS:

```python
>>> response = ssm.get_parameter(Name='/test/ruan/mysql/db01/mysql_hostname')
>>> print(response['Parameter']['Value'])
AQICAHh7jazUUBgNxMQbYFeve2/p+UWTuyAd5F3ZJkZkf9+hwgF+H+kSABfPCTEarjXqYBaJAAAAejB4BgkqhkiG9w0BBwagazBpAgEAMGQGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMJUEuT8wDGCQ3zRBmAgEQgDc8LhLgFe+Rutgi0hOKnjTEVQa2lKTy3MmTDZEeLy3Tlr5VUl6AVJNBpd4IWJTbj5YuqrrAAWWJ
```

As you can see the value is encrypted, this time read the parameter value with specifying decryption via KMS:

```python
>>> response = ssm.get_parameter(Name='/test/ruan/mysql/db01/mysql_hostname', WithDecryption=True)
>>> print(response['Parameter']['Value'])
db01.eu-west-1.mycompany.com
```

## Grant Permissions to Instance Profile:

Now we will create a policy that can only decrypt and read values from SSM that matches the path: `/test/ruan/mysql/db01/mysql_*`. This policy will be associated to a instance profile role, which will be used by EC2, where our application will read the values from.

Our policy will look like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Stmt1517398919242",
      "Action": [
        "kms:Decrypt"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:kms:eu-west-1:0123456789012:key/foobar-2162-4363-ba02-a953729e5ce6"
    },
    {
      "Sid": "Stmt1517399021096",
      "Action": [
        "ssm:GetParameter"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:ssm:eu-west-1:0123456789012:parameter/test/ruan/mysql/db01/mysql_*"
    }
  ]
}
```

Create the Policy:

```python
>>> pol = '{"Version": "2012-10-17","Statement": [{"Sid": "Stmt1517398919242","Action": ["kms:Decrypt"],"Effect": "Allow","Resource": "arn:aws:kms:eu-west-1:0123456789012:key/foobar-2162-4363-ba02-a953729e5ce6"},{"Sid": "Stmt1517399021096","Action": ["ssm:GetParameter"],"Effect": "Allow","Resource": "arn:aws:ssm:eu-west-1:0123456789012:parameter/test/ruan/mysql/db01/mysql_*"}]}'
>>> response = iam.create_policy(PolicyName='RuanGetSSM-Policy', PolicyDocument=pol, Description='Test Policy to Get SSM Parameters')
```

Create the instance profile:

```python
>>> response = iam.create_instance_profile(InstanceProfileName='RuanTestSSMInstanceProfile')
```

Create the Role:

```python
>>> response = iam.create_role(RoleName='RuanTestGetSSM-Role', AssumeRolePolicyDocument='{"Version": "2012-10-17","Statement": [{"Sid": "","Effect": "Allow","Principal": {"Service": "ec2.amazonaws.com"},"Action": "sts:AssumeRole"}]}')
```

Associate the Role and Instance Profile:

```python
>>> response = iam.add_role_to_instance_profile(InstanceProfileName='RuanTestSSMInstanceProfile', RoleName='RuanTestGetSSM-Role')
```

Attach the Policy to the Role:

```python
>>> response = iam.put_role_policy(RoleName='RuanTestGetSSM-Role', PolicyName='RuanTestGetSSMPolicy1', PolicyDocument=pol')
```

Launch the EC2 instance with the above mentioned Role. Create the `get_ssm.py` and run it to decrypt and read the value from SSM:

```python get_ssm.py
import boto3
session = boto3.Session(region_name='eu-west-1')
ssm = session.client('ssm')
hostname = ssm.get_parameter(Name='/test/ruan/mysql/db01/mysql_hostname', WithDecryption=True)
print(hostname['Parameter']['Value'])
```

Run it:

```bash
$ python get_ssm.py
db01.eu-west-1.mycompany.com
```

## Reading with GetParameters:

So say that we created more than one parameter in the path that we allowed, lets use `GetParameters` to read more than one Parameter:

```python get_parameters.py
import boto3
session = boto3.Session(region_name='eu-west-1')
ssm = session.client('ssm')
response = ssm.get_parameters(
    Names=[
        '/test/ruan/mysql/db01/mysql_hostname', 
        '/test/ruan/mysql/db01/mysql_user'
    ], 
    WithDecryption=True
)

for secrets in response['Parameters']:
    if secrets['Name'] == '/test/ruan/mysql/db01/mysql_hostname':
        print("Hostname: {}".format(secrets['Value']))
    if secrets['Name'] == '/test/ruan/mysql/db01/mysql_user':
        print("Username: {}".format(secrets['Value']))
```

Run it:

```bash
$ python get_parameters.py
Hostname: db01.eu-west-1.mycompany.com
Username: super_dba
```

## Environment Variable Example from an Application:

Set the Environment Variable value to the SSM key:

```bash
$ export MYSQL_HOSTNAME="/test/ruan/mysql/db01/mysql_hostname"
$ export MYSQL_USERNAME="/test/ruan/mysql/db01/mysql_user"
```

The application code:

```python
import os
import boto3

session = boto3.Session(region_name='eu-west-1')
ssm = session.client('ssm')

MYSQL_HOSTNAME = os.environ.get('MYSQL_HOSTNAME')
MYSQL_USERNAME = os.environ.get('MYSQL_USERNAME')

hostname = ssm.get_parameter(Name=MYSQL_HOSTNAME, WithDecryption=True)
username = ssm.get_parameter(Name=MYSQL_USERNAME, WithDecryption=True)

print("Hostname: {}".format(hostname['Parameter']['Value']))
print("Username: {}".format(username['Parameter']['Value']))
```

Let the application transform the key to the SSM Value:

```bash
$ python app.py
Hostname: db01.eu-west-1.mycompany.com
Username: super_dba
```

## Resources:

Great thanks to the following resources:

- https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-su-organize.html
- https://docs.aws.amazon.com/cli/latest/userguide/cli-roles.html
- https://github.com/iMilnb/awstools/blob/master/platforms/roles/mkrole.py
- https://github.com/ktruckenmiller/ssm-get-parameter-by-path/blob/master/python.py
