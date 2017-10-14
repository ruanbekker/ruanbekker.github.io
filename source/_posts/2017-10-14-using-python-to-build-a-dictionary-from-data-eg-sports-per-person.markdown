---
layout: post
title: "Using Python to build a Dictionary from data eg sports per person"
date: 2017-10-14 14:53:48 -0400
comments: true
categories: ["python", "python-dicitionary", "python-list"i, "programming", "scripting"] 
---

I had to achieve a way to provide data in key-value format, where I wanted to see what sports people like, eg: `{"ruan": ["rugby", "cricket"]}`

## The Idea

So my idea was to have the `name` as the key, and the `sports` as the value in a list.

## Some Catches

So for this post, I will be setting the data statically in the code, while at the time I was working data that was returned via a API.

I am looping through each occurence, adding the name, and when the name exists, I append the sport to the list of the person.

The catch was that, if there was any duplicated data, the person will only exists once in the dictionary that I am building, but the sport will be appended, so if there were 2 occurences of `rugby` it will show the sport 2 times. So I had to put some logic into the code to handle that.

## The Code

```python
"""|Info:

Printing Sports per Person, by looping through data, appending the sports to a list per person, which gets added to our dictionary.

Variables:
	group {dict} -- "the dictionary that we are building up"
	people {list} -- "list of people with their sport choices"
	for sportman in people: {[for-loop]} -- "iterating through our data, if the sport exists, continue, if not, apeend it to the list"
	print(group) {[dict]} -- "printing the results"
"""

group = {}
people = [
	{
		"name": "ruan", 
		"sport": "cricket"
	}, 
	{
		"name": "stefan", 
		"sport": "rugby"
	}, 
	{
		"name": "stefan", 
		"sport": "cricket"
	}, 
	{
		"name": "james", 
		"sport": "rugby"
	}, 
	{
		"name": "james", 
		"sport": "golf"
	}, 
	{
		"name": "stefan", 
		"sport": "rugby"
	}, 
	{
		"name": "james", 
		"sport": "hockey"
	}
]

for sportman in people:
    if sportman['name'] in group:
        if sportman['sport'] not in group[sportman['name']]:
            group[sportman['name']].append(sportman['sport'])
        else:
            pass
    else:
        group[sportman['name']] = []
        group[sportman['name']].append(sportman['sport'])

print(group)

```

## Running the Script:

When running the script results in the following:

```bash
$ python sports.py 
{'james': ['rugby', 'golf', 'hockey'], 'ruan': ['cricket'], 'stefan': ['rugby', 'cricket']}

```
