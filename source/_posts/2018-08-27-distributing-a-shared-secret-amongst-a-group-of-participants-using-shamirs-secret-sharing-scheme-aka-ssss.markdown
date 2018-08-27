---
layout: post
title: "Distributing a Shared Secret amongst a Group of Participants using Shamirs Secret Sharing Scheme aka ssss"
date: 2018-08-27 18:29:48 -0400
comments: true
categories: ["security", "ssss", "cryptography", "encryption", "authentication", "mfa"]
---

![](https://objects.ruanbekker.com/assets/images/cryptography-word-logo.png)

In situations where a group of participants join together to split up a secret in a form of secret sharing, where the secret is devided into parts, giving each participant their own unique part. Together contributing to reconstruct the initial secret. We can achieve this with Shamir's Secret Sharing which is an algorithm in cryptography created by [Adi Shamir](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing).

## More info on Secret Sharing

Referenced from [Wikipedia: Secret Sharing](https://en.wikipedia.org/wiki/Secret_sharing):

"Secret sharing (also called secret splitting) refers to methods for distributing a secret amongst a group of participants, each of whom is allocated a share of the secret. The secret can be reconstructed only when a sufficient number, of possibly different types, of shares are combined together; individual shares are of no use on their own."

## Installing ssss

On Mac OSX:

```
$ brew install ssss
```

On Debian:

```
$ apt install ssss -y
```

## Creating a Secret:

Generate a Secret where we will distribute 5 shares, where each participant will have their own unique share, and to reconstruct the secret, we will need 3 participants to rebuild the secret. In our case our shares will be distributed to the following example users:

```
- Share 1: James
- Share 2: John
- Share 3: Frank
- Share 4: Paul
- Share 5: Ryan
```

For this demonstration our secret's value will be `SuperSecret@123!`, which we will split into 5 shares, but to reconstruct, we need 3 parts / shares:

```bash
$ ssss-split -t 3 -n 5
Generating shares using a (3,5) scheme with dynamic security level.
Enter the secret, at most 128 ASCII characters: Using a 128 bit security level.
1-41ac84013bf568d1cc88b751539f1ff5
2-7d9ca3ca26442bfcca35e0ad205e5659
3-519038837bbf1b7ceefde331ad1ae40f
4-6d4f4e0f086af5be033f516bb3e227d2
5-4143d5465591c53e27f752f73ea69596
```

In this case, each share will be distributed to each user to save in a secure location.

## Reconstructing the Secret:

Let's reconstruct the secret, and as we need 3 participants, we will ask `John`, `Paul` and `Ryan` for their shares, so that we can reconstruct the secret:

```bash
$ ssss-combine -t 3
Enter 3 shares separated by newlines:
Share [1/3]: 2-7d9ca3ca26442bfcca35e0ad205e5659
Share [2/3]: 4-6d4f4e0f086af5be033f516bb3e227d2
Share [3/3]: 5-4143d5465591c53e27f752f73ea69596
Resulting secret: SuperSecret@123!
```

As you can see the secret is verified the same as the initial secret.

## Using ssss and qrencode for MFA Codes

This can be useful for Multi Factor Authentication as well. Setup a Virtual MFA with a Identity that supports MFA Authentication, copy or make note of the "Secret Key / Secret Configuration Key", go ahead and setup the MFA Device on your MFA Device to complete the setup.

Once verified and able to logon, logout and delete the MFA Account from your Device.

Generate the same share scheme for the MFA Secret Key, for this example: `ABCDEXAMPLE1029384756`:

```bash
$ ssss-split -t 3 -n 5
Generating shares using a (3,5) scheme with dynamic security level.
Enter the secret, at most 128 ASCII characters: Using a 168 bit security level.
1-8d2cf979fb346297cab47ff691bddc1c5a5f34af37
2-4d0f2cdcfff653cc60a4f293c15805f7e84b0a956d
3-dadb6d2cbe42772c9a9042273f0b71dd71422f19cb
4-546bcef428151ceb01fdc6007ac2e5e4f1516670ca
5-c3bf8f0469a1380bfbc976b4849191ce685843fc7e
```

Distribute the Shares, and when the MFA Device needs to be restored on a Device, reconstruct the secret to get the Secret Key for the MFA Device:

```bash
$ ssss-combine -t 3
Enter 3 shares separated by newlines:
Share [1/3]: 1-8d2cf979fb346297cab47ff691bddc1c5a5f34af37
Share [2/3]: 2-4d0f2cdcfff653cc60a4f293c15805f7e84b0a956d
Share [3/3]: 3-dadb6d2cbe42772c9a9042273f0b71dd71422f19cb
Resulting secret: ABCDEXAMPLE1029384756
```

Now that we have the Secret Key for our MFA Device, let's Generate a QRCode that we can scan in from our device, which will save us from typing a lot of characters. We will need `qrencode` for this:

For Mac OSX:

```
$ brew install qrencode
```

for Debian:

```bash
$ apt install qrencode -y
```

To generate the QRCode, we will pass the filename: `myqrcode.png`, the name that will appear on our device: `MyNewMFADevice`, and the Secret: `ABCDEXAMPLE1029384756`:

```
$ qrencode -o myqrcode.png -d 300 -s 10 "otpauth://totp/MyNewMFADevice?secret=ABCDEXAMPLE1029384756"
```

You will find the `myqrcode.png` in your current working directory, open the file scan the barcode and your MFA device will be setup and enabled to use.

## Resources:

- https://en.wikipedia.org/wiki/Secret_sharing
- http://point-at-infinity.org/ssss/
- https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html#enable-virt-mfa-for-iam-user
