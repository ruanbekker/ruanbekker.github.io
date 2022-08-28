---
layout: post
title: "Paginate through IAM Users on AWS using Python and Boto3"
date: 2019-01-29 10:03:24 -0500
comments: true
categories: ["aws", "iam", "python", "boto3"] 
---

When listing AWS IAM Users in Boto3, you will find that not all the users are retrieved. This is because they are paginated.

To do a normal list_users api call:

```python
>>> import boto3
>>> iam = boto3.Session(region_name='eu-west-1', profile_name='default').client('iam')
>>> len(iam.list_users()['Users'])
100
```

Although I know there's more than 200 users. Therefore we need to paginate through our users:

```python
>>> import boto3
>>> iam = boto3.Session(region_name='eu-west-1', profile_name='default').client('iam')
>>> paginator = iam.get_paginator('list_users')
>>> users = []
>>> all_users = []
>>> for response in paginator.paginate():
...     users.append(response['Users'])
...
>>> len(users)
3

>>> for iteration in xrange(len(users)):
...     for userobj in xrange(len(users[iteration])):
...         all_users.append((users[iteration][userobj]['UserName']))
...
>>> len(all_users)
210
```

For more information on this, have a look at AWS Documentation about [Pagination](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/paginators.html)

## Thank You

Please feel free to show support by, **sharing** this post, making a **donation**, **subscribing** or **reach out to me** if you want me to demo and write up on any specific tech topic.

<center>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="W7CBGYTCWGANQ" />
<input type="image" src="https://user-images.githubusercontent.com/567298/49853901-461c3700-fdf1-11e8-9d80-8a424a3173af.png" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_ZA/i/scr/pixel.gif" width="1" height="1" />
</form>
</center>

<br>

<script type="text/javascript">
  ( function() {
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"rbekker87","width":728,"height":90,"sid":"Chitika Default"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());
</script>
<script type="text/javascript" src="//cdn.chitika.net/getads.js" async></script>
