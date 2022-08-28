---
layout: post
title: "Python Script to Decrypt Encrypted Data with AWS KMS"
date: 2017-10-20 04:54:51 -0400
comments: true
categories: ["aws", "python", "kms", "encryption", "security"] 
---

Quick script to decrypt data that was encrypted with your KMS key:

## The Script:

The script requires the encrypted scring as an argument:

```python
#!/usr/bin/env python

import boto3
import sys
from base64 import b64decode

try:
    encrypted_value = sys.argv[1]
except IndexError:
    print("Usage: {} {}".format(sys.argv[0], 'the-encrypted-string'))
    exit(1)

session = boto3.Session(
        region_name='eu-west-1',
        profile_name='default'
    )

kms = session.client('kms')

response = kms.decrypt(CiphertextBlob=b64decode(encrypted_value))['Plaintext']
print("Decrypted Value: {}".format(response))
```

Change the permissions so that the file is executable:

```bash
$ chmod +x decrypt.py
```

## Usage:

```bash
$ ./decrypt.py asdlaskjdasidausd09q3uoijad09ujd38u309
Decrypted Value: thisIsMyDecryptedValue
```
