---
layout: post
title: "Convert Float to Decimal Data Types for Boto3 DynamoDB using Python"
date: 2019-02-05 09:45:40 -0500
comments: true
categories: ["python", "boto3", "dynamodb", "decimal", "float"] 
---

A quick post on a workaround when you need to convert float to decimal types.

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

One thing I really don't like about the AWS SDK for Python, specifically aimed towards DynamoDB is that Float types are not supported and that you should use Decimal types instead.

For example, my payload below:

```python
>>> data
{'attempts': 5, 'min': 180.87, 'timestamp': '2019-02-05T15:48:27', 'address': 'dynamodb.us-east-1.amazonaws.com', 'max': 747.17, 'region': 'eu-west-1_dynamodb', 'avg': 311.32599999999996, 'port': 443, 'regionTo': 'us-east-1', 'results': [{'seq': 1, 'time': '747.17'}, {'seq': 2, 'time': '215.60'}, {'seq': 3, 'time': '230.67'}, {'seq': 4, 'time': '180.87'}, {'seq': 5, 'time': '182.32'}]}
```

Trying to write that as an Item to my DynamoDB table and you will be faced with the exception below:

```python
>>> ddb.put_item(Item=data)
TypeError: Float types are not supported. Use Decimal types instead.
```

One way around this is to use `parse_float` in `json.loads()`:

```
>>> from decimal import Decimal
>>> import json
>>> ddb_data = json.loads(json.dumps(data), parse_float=Decimal)
>>> ddb_data
{u'max': Decimal('747.17'), u'min': Decimal('180.87'), u'timestamp': u'2019-02-05T15:48:27', u'region': u'eu-west-1_dynamodb', u'regionTo': u'us-east-1', u'results': [{u'seq': 1, u'time': u'747.17'}, {u'seq': 2, u'time': u'215.60'}, {u'seq': 3, u'time': u'230.67'}, {u'seq': 4, u'time': u'180.87'}, {u'seq': 5, u'time': u'182.32'}], u'attempts': 5, u'address': u'dynamodb.us-east-1.amazonaws.com', u'avg': Decimal('311.32599999999996'), u'port': 443}
```

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
