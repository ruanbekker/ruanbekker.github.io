---
layout: post
title: "Encryption and Decryption with the PyCrypto module using the AES Cipher in Python"
date: 2018-04-30 01:43:26 -0400
comments: true
categories: ["python", "cryptography", "aes", "encryption", "pycrypto", "security"]
---

![](https://i.snag.gy/0MaLsx.jpg)

While I'm learning a lot about encryption at the moment, I wanted to test out encryption with the PyCrypto module in Python using the [Advanced Encryption Standard (AES)](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) Symmetric Block Cipher.

## Installing PyCrypto:

```bash
$ pip install pycrypto --user
```

## PyCrypto Example:

Our AES Key needs to be either 16, 24 or 32 bytes long and our Initialization Vector needs to be 16 Bytes long. That will be generated using the random and string modules.

Encrypting:

```python
>>> from Crypto.Cipher import AES
>>> import random, string, base64

>>> key = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for x in range(32))
>>> iv = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for x in range(16))

>>> print(key, len(key))
('BLhgpCL81fdLBk23HkZp8BgbT913cqt0', 32)
>>> print(iv, len(iv))
('OWFJATh1Zowac2xr', 16)

>>> enc_s = AES.new(key, AES.MODE_CFB, iv)
>>> cipher_text = enc_s.encrypt('this is a super important message')
>>> encoded_cipher_text = base64.b64encode(cipher_text)
>>> print(encoded_cipher_text)
'AtBa6zVB0UQ3U/50ogOb6g09FlyPdpmJB7UzoCqxhsQ6'
```

Decrypting:

```python
>>> from Crypto.Cipher import AES
>>> import base64
>>> key = 'BLhgpCL81fdLBk23HkZp8BgbT913cqt0'
>>> iv = 'OWFJATh1Zowac2xr'

>>> decryption_suite = AES.new(key, AES.MODE_CFB, iv)
>>> plain_text = decryption_suite.decrypt(base64.b64decode(encoded_cipher_text))
>>> print(plain_text)
this is a super important message
```

It's not needed to use base64, but to have the ability to stay away from strange characters I decided to encode them with base64 :D

## References:

- [PyCrypto](http://docs.python-guide.org/en/latest/scenarios/crypto/)
- [Wiki - AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [Wiki - CFB Mode](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_Feedback_(CFB))
