---
layout: post
title: "Encryption and Decryption with Simple Crypt using Python"
date: 2018-04-29 10:50:46 -0400
comments: true
categories: ["python", "cryptography", "encryption", "decryption", "simple-crypt"] 
---
Today I wanted to encrypt sensitive information to not expose passwords, hostnames etc. I wanted to have a way to encrypt my strings with a master password and stumbled upon Simple Crypt.

## Simple Crypt

Why simple-crypt? Referenced from their [docs](https://pypi.org/project/simple-crypt/):

- Simple Crypt uses standard, well-known algorithms following the recommendations from [this](http://www.daemonology.net/blog/2009-06-11-cryptographic-right-answers.html) link.
- The PyCrypto library provides the algorithm implementation, where AES256 cipher is used.
- It includes a check (an HMAC with SHA256) to warn when ciphertext data are modified.
- It tries to make things as secure as possible when poor quality passwords are used (PBKDF2 with SHA256, a 256 bit random salt, and 100,000 rounds). 
- Using a library, rather than writing your own code, means that we have less solutions to the same problem. 

## Installing Simple-Crypt:

From a base alpine image:

```bash
$ apk update
$ apk add python python-dev py2-pip
$ apk add gcc g++ make libffi-dev openssl-dev
$ pip install simple-crypt
```

## Simple Examples:

Two simple examples to encrypt and decrypt data with simple-crypt. We will use a password `sekret` and we will encrypt the string: `this is a secure message`:

```python
>>> from simplecrypt import encrypt, decrypt
>>> password = 'sekret'
>>> message = 'this is a secret message'
>>> ciphertext = encrypt(password, message)
>>>
>>> print(ciphertext)
sc#$%^&*(..........
```

Now that we have our encrypted string, lets decrypt it. First we will use the wrong password, so that you will see how the expected output should look when using a different password, than was used when it was encrypted:

```python
>>> print(decrypt('badpass', ciphertext))
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/lib/python2.7/site-packages/simplecrypt/__init__.py", line 72, in decrypt
    _assert_hmac(hmac_key, hmac, hmac2)
  File "/usr/lib/python2.7/site-packages/simplecrypt/__init__.py", line 116, in _assert_hmac
    raise DecryptionException('Bad password or corrupt / modified data.')
simplecrypt.DecryptionException: Bad password or corrupt / modified data.
```

Now using the correct password to decrypt:

```python
>>> print(decrypt('sekret', ciphertext))
this is a secret message
```

## SimpleCrypt Base64 and Getpass

I wanted to store the encrypted string in a database, but the ciphertext has a combination of random special characters, so I decided to encode the ciphertext with base64. And the password input will be used with the getpass module.

Our encryption app:

```python encrypt.py
import sys
from simplecrypt import encrypt, decrypt
from base64 import b64encode, b64decode
from getpass import getpass

password = getpass()
message = sys.argv[1]

cipher = encrypt(password, message)
encoded_cipher = b64encode(cipher)
print(encoded_cipher)
```

Our decryption app:

```python
import sys
from simplecrypt import encrypt, decrypt
from base64 import b64encode, b64decode
from getpass import getpass

password = getpass()
encoded_cipher = sys.argv[1]

cipher = b64decode(encoded_cipher)
plaintext = decrypt(password, cipher)
print(plaintext)
```

## Encrypt and Decrypting Data using our Scripts:

Encrypting the string `this is a secret message`:

```bash
$ python encrypt.py "this is a secret message"
Password: 
c2MAAnyfWIfOBV43vxo3sVCEYMG4C6hx69hv2Ii1JKlVHJUgBAlADJPOsD5cJO6MMI9faTDm1As/VfesvBzIe5S16mNyg2q7xfnP5iJ0RlK92vMNRbKOvNibg3M=
```

Now that we have our encoded ciphertext, lets decrypt it with the password that we encrypted it with:

```bash
$ python decrypt.py 'c2MAAnyfWIfOBV43vxo3sVCEYMG4C6hx69hv2Ii1JKlVHJUgBAlADJPOsD5cJO6MMI9faTDm1As/VfesvBzIe5S16mNyg2q7xfnP5iJ0RlK92vMNRbKOvNibg3M='
Password: 
this is a secret message
```

This is one way of working with sensitive info that you would like to encrypt/decrypt.
