---
layout: post
title: "Setup AWS S3 Cross Account Access"
description: "In this tutorial we will setup AWS S3 Cross Account Access between Two AWS Accounts"
date: 2019-11-26 22:40:12 +0200
comments: true
categories: ["aws", "s3", "iam"]
---

[![Say Thanks!](https://img.shields.io/badge/Say%20Thanks-!-1EAEDB.svg)](https://saythanks.io/to/ruanbekker) [![Slack Status](https://linux-hackers-slack.herokuapp.com/badge.svg)](https://linux-hackers-slack.herokuapp.com/) [![Chat on Slack](https://img.shields.io/badge/chat-on_slack-orange.svg)](https://linux-hackers.slack.com/) [![GitHub followers](https://img.shields.io/github/followers/ruanbekker.svg?label=Follow&style=social)](https://github.com/ruanbekker)

<a href="https://twitter.com/ruanbekker?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @ruanbekker</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

In this tutorial I will demonstrate how to setup cross account access from S3.

## Scenario

We will have 2 AWS Accounts:

1. a Green AWS Account which will host the IAM Users, this account will only be used for our IAM Accounts.

2. a Blue AWS Account which will be the account that hosts our AWS Resources, S3 in this scenario.

We will the allow the Green Account to access the Blue Account's S3 Bucket.

## Setup the Blue Account

In the Blue Account, we will setup the S3 Bucket, as well as the Trust Relationship with the Policy, which is where we will define what we want to allow for the Green Account.

<img width="1280" alt="9488F107-A5B0-4A9E-A7A4-5A91B9805DE3" src="https://user-images.githubusercontent.com/567298/69668149-fe40ff00-1097-11ea-896a-5f3106fe5dfa.png">

Now we need to setup the IAM Role which will allow the Green Account and also define what needs to be allowed.

Go ahead to your IAM Console and create a IAM Policy (just remember to replace the bucket name if you are following along)

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PutGetListAccessOnS3",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ruanbekker-prod-s3-bucket",
                "arn:aws:s3:::ruanbekker-prod-s3-bucket/*"
            ]
        }
    ]
}
```

In my case I have named my IAM Policy `CrossAccountS3Access`. After you have created your IAM Policy, go ahead and create a IAM Role. Here we need the source account that we want to allow as a trusted entity, which will be the AWS AccountId of the Green Account:

<img width="1277" alt="E73FC957-EBFA-4E41-AFDB-D994D6D3110E" src="https://user-images.githubusercontent.com/567298/69668615-ee75ea80-1098-11ea-8536-b32c6c034f7a.png">

Associate the IAM Policy that you created earlier:

<img width="1280" alt="610814A8-E8CB-45F7-A038-FE4274FD425C" src="https://user-images.githubusercontent.com/567298/69668712-19603e80-1099-11ea-8ba0-2d0bc84e21cf.png">

After you have done that, you should see a summary screen:

<img width="1278" alt="ABAADD0E-9140-4EB1-855A-0B0E46F429FF" src="https://user-images.githubusercontent.com/567298/69668817-50ceeb00-1099-11ea-8bb2-98537a742857.png">

Make note of your IAM Role ARN, it will look something like this: `arn:aws:iam::xxxxxxxxxxxx:role/CrossAccountS3Access-Role`

## Setup the Green Account

In the Green Account is where we will create the IAM User and the credentials will be provided to the user which requires to access the S3 Bucket.

Let's create a IAM Group, I will name mine `prod-s3-users`. I will just create the group, as I will attach the policy later:

<img width="1280" alt="459D98BF-7A5D-49B4-BBD9-11717655188D" src="https://user-images.githubusercontent.com/567298/69669190-07cb6680-109a-11ea-8193-db476f5fa1db.png">

From the IAM Group, select the Permissions tab and create a New Inline Policy:

<img width="1280" alt="E55E521D-A3C1-4669-B0AB-C23A5BA51E21" src="https://user-images.githubusercontent.com/567298/69669427-81635480-109a-11ea-8b4b-7bd79f2a12cd.png">

Select the "STS" service, select the "AssumeRole" action, and provide the Role ARN of the Blue Account that we created earlier:

<img width="1280" alt="FDECEF7C-14F1-41DC-94F5-B6E63FE46A7D" src="https://user-images.githubusercontent.com/567298/69669597-d8692980-109a-11ea-804c-914c9a8cb608.png">

This will allow the Blue account to assume the credentials from the Green account. And the Blue account will only obtain permissions to access the resources that we have defined in the policy document of the Blue Account. In summary, it should look like this:

<img width="1280" alt="0133A1AF-D2B0-4A61-B179-B4B40B81953C" src="https://user-images.githubusercontent.com/567298/69669773-30079500-109b-11ea-83bd-69c8301c4f21.png">

Select the Users tab on the left hand side, create a New IAM User (I will name mine s3-prod-user) and select the "Programmatic Access" check box as we need API keys as we will be using the CLI to access S3:

<img width="1278" alt="ACE1F066-4400-4000-A9D8-0FD438DB7028" src="https://user-images.githubusercontent.com/567298/69669927-82e14c80-109b-11ea-9adf-de5c01cec41c.png">

Then from the next window, add the user to the group that we have created earlier:

<img width="1279" alt="0AEC8E84-091F-44CB-966D-BDA93970C881" src="https://user-images.githubusercontent.com/567298/69669976-9987a380-109b-11ea-9c16-ea63cebe2e82.png">

## Test Cross Account Access

Let's configure our AWS CLI with the API Keys that we received. Our credential provider will consist with 2 profiles, the Green Profile which holds the API Keys of the Green Account:

```
$ aws configure --profile green
AWS Access Key ID [None]: AKIATPRT2G4SAHA7ZQU2
AWS Secret Access Key [None]: x
Default region name [None]: eu-west-1
Default output format [None]: json
```

And configure the Blue profile that will reference the Green account as a source profile and also specify the IAM Role ARN of the Blue Account:

```
$ vim ~/.aws/credentials
```
```
[blue]
role_arn=arn:aws:iam::xxxxxxxxxxxx:role/CrossAccountS3Access-Role
source_profile=green
region=eu-west-1
```

Now we can test if we can authenticate with our Green AWS Account:

```
$ aws --profile green sts get-caller-identity
{
    "UserId": "AKIATPRT2G4SAHA7ZQU2",
    "Account": "xxxxxxxxxxxx",
    "Arn": "arn:aws:iam:: xxxxxxxxxxxx:user/s3-prod-user"
}
```

Now let's upload an object to S3 using our blue profile:

```
$ aws --profile blue s3 cp foo s3://ruanbekker-prod-s3-bucket/
upload: ./foo to s3://ruanbekker-prod-s3-bucket/foo
```

Let's verify if we can see the object:

```
$ aws --profile blue s3 ls s3://ruanbekker-prod-s3-bucket/
2019-10-03 22:13:30      14582 foo
```

## Thank You

Let me know what you think. If you liked my content, feel free to checkout my content on **[ruan.dev](https://ruan.dev/)** or follow me on twitter at **[@ruanbekker](https://twitter.com/ruanbekker)**

<center><script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script></center>

I've recently started a "developer range" t-shirts, let me know what you think:

<div id='product-component-1574800622582'></div>
<script type="text/javascript">
/*<![CDATA[*/
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript();
    }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: 'bekkerclothing.myshopify.com',
      storefrontAccessToken: '68eb29a6d90539cb0321ea90bb043fae',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: '4392613544020',
        node: document.getElementById('product-component-1574800622582'),
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
  "product": {
    "styles": {
      "product": {
        "@media (min-width: 601px)": {
          "max-width": "calc(25% - 20px)",
          "margin-left": "20px",
          "margin-bottom": "50px"
        }
      }
    },
    "text": {
      "button": "Add to cart"
    }
  },
  "productSet": {
    "styles": {
      "products": {
        "@media (min-width: 601px)": {
          "margin-left": "-20px"
        }
      }
    }
  },
  "modalProduct": {
    "contents": {
      "img": false,
      "imgWithCarousel": true,
      "button": false,
      "buttonWithQuantity": true
    },
    "styles": {
      "product": {
        "@media (min-width: 601px)": {
          "max-width": "100%",
          "margin-left": "0px",
          "margin-bottom": "0px"
        }
      }
    },
    "text": {
      "button": "Add to cart"
    }
  },
  "cart": {
    "text": {
      "total": "Subtotal",
      "button": "Checkout"
    }
  }
},
      });
    });
  }
})();
/*]]>*/
</script>
