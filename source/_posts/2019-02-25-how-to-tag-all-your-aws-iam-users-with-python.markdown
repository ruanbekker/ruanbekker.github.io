---
layout: post
title: "How to Tag all your AWS IAM Users with Python"
date: 2019-02-25 06:44:55 -0500
comments: true
categories: ["aws", "iam", "python", "boto3", "scripting"] 
---

Let's say that all your IAM users are named in `name.surname` and your system accounts are named as `my-system-account` and you find yourself in a position that you need to tag all your IAM users based on Human/System account type.

<script src="//ap.lijit.com/www/delivery/fpi.js?z=601358&width=300&height=250"></script>

With AWS and Python's Boto library, it makes things easy. We would list all our users, loop through each one and tag them with the predefined tag values that we chose.

## Batch Tagging AWS IAM Users with Python

This script wil tag all users with the tag: Name, Email, Environment and Account_Type.

```python
import boto3

iam = boto3.Session(profile_name='test', region_name='eu-west-1').client('iam')
paginator = iam.get_paginator('list_users')

iam_environment = 'test'

unstructed_users = []
userlist = []
taggable_users = []
already_tagged_users = []
email_address_domain = '@example.com'

# generate tag list based on account type
def tag_template(username, environment):
    if '.' in username:
        account_type = 'human'
	email = username
    else:
        account_type = 'system'
	email = 'system-admin'
	
    template = [
        {'Key': 'Name','Value': username.lower()}, 
        {'Key': 'Email', 'Value': email.lower() + email_address_domain}, 
        {'Key': 'Environment','Value': environment}, 
        {'Key': 'Account_Type','Value': account_type}
    ]

    return template

# generate userlist
for response in paginator.paginate():
    unstructed_users.append(response['Users'])

for iteration in range(len(unstructed_users)):
    for userobj in range(len(unstructed_users[iteration])):
        userlist.append((unstructed_users[iteration][userobj]['UserName']))

# generate taggable userlist:
for user in userlist:
    tag_response = iam.list_user_tags(UserName=user)
    if len(tag_response['Tags']) == 0:
        taggable_users.append(user)
    else:
        already_tagged_users.append(user)

# tag users from taggable_list
for tag_user in taggable_users:
    user_template = tag_template(tag_user, iam_environment)
    print(tag_user, user_template)
    response = iam.tag_user(UserName=tag_user, Tags=user_template)

# print lists
print('Userlists: {}'.format(userlist))
print('Taggable Users: {}'.format(taggable_users))
print('Already Tagged Users: {}'.format(already_tagged_users))
``` 

After it completes, your IAM users should be tagged in the following format:

```
Name: john.doe
Email: john.doe@example.com
Environment: test
Account_Type: human

or:

Name: system-account
Email: system-admin@example.com
Environment: test
Account-Type: system
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
