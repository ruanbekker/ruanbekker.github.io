---
layout: post
title: "Encrypt and Decrypt files with ccrypt"
date: 2020-11-20 06:27:01 +0000
comments: true
categories: ["encryption", "security", "ccrypt"]
---

This is a quick post to demonstrate how to encrypt and decrypt files with **ccrypt**

## About

Ccrypt's description from its project page:

*Encryption and decryption depends on a keyword (or key phrase) supplied by the user. By default, the user is prompted to enter a keyword from the terminal. Keywords can consist of any number of characters, and all characters are significant (although ccrypt internally hashes the key to 256 bits). Longer keywords provide better security than short ones, since they are less likely to be discovered by exhaustive search.*

Ref: http://ccrypt.sourceforge.net/


## Install

For debian based systems, to install ccrypt:

```
$ sudo apt-get install ccrypt
```

## Usage

To encrypt files, write a file to disk:

```
$ echo "ok" > file.txt
```

Then encrypt the file by providing a password:

```
$ ccencrypt file.txt
Enter encryption key:
Enter encryption key: (repeat)
```

It encrypts and only the encrypted file can be found:

```
$ ls
file.txt.cpt
```

Decrypt the file, by providing your password that you encrypted it with:

```
$ ccdecrypt file.txt.cpt
Enter decryption key:
```

View the decrypted file:

```
$ cat file.txt
ok
```


