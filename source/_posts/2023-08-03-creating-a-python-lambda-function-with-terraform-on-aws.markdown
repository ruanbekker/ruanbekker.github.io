---
layout: post
title: "Creating a Python Lambda Function with Terraform on AWS"
date: 2023-08-03 11:29:35 -0400
comments: true
categories: ["aws", "terraform", "devops", "python"]
dont_redirect: true
---

In this tutorial I will explain how to deploy a AWS Lambda Function with Terraform using the Python runtime. It will include the permissions it needs to write its logs to AWS CloudWatch as well as to get information from the AWS API's as a boilerplate for you to expand on it.

We will also use CloudWatch Events to trigger this lambda function every two hours.

## Pre-Requisites

First you will need to have [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed as well as authentication for Terraform to interact with your AWS account, I have written a post about it and you can follow that on "[How to use the AWS Terraform Provider](https://blog.ruanbekker.com/blog/2023/07/15/how-to-use-the-aws-terraform-provider/)".

## Project Structure

The following code will be available on my [github repository](https://github.com/ruanbekker/terraformfiles/tree/master/modules/aws-lambda-function), but if you would like to follow along we will create everything step by step.

First create the project directory:

```bash
mkdir -p ~/workspace/aws-lambda-terraform
```

Then change into the directory:

```bash
cd ~/workspace/aws-lambda-terraform
```

First we want to create our modules directory:

```bash
mkdir -p modules/lambda-function
```

Then our environment directory:

```bash
mkdir -p environment/test
```

We will also create the directory for our function code:

```bash
mkdir -p modules/lambda-function/functions
```

And we can create the file for our python function:

```bash
touch modules/lambda-function/functions/demo.py
```

Now we will create our files inside our modules directory:

```bash
touch modules/lambda-function/{main,versions,outputs,variables}.tf
```

Then create the files inside our environments directory:

```bash
touch environment/test/{main,provider,output}.tf
```

Then in summary our project structure should look more or less like this:

```bash
tree .
.
├── environment
│   └── test
│       ├── main.tf
│       ├── output.tf
│       └── provider.tf
└── modules
    └── lambda-function
        ├── functions
        │   └── demo.py
        ├── main.tf
        ├── outputs.tf
        ├── variables.tf
        └── versions.tf

5 directories, 8 files
```

## Terraform Code

We will first start populating the modules bit, and start with `modules/lambda-function/main.tf`:

```
data "aws_iam_policy_document" "lambda" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_execution" {
  count = var.logs_enabled ? 1 : 0

  statement {
    sid     = "GetCallerIdentity"
    effect  = "Allow"

    actions = [
      "sts:GetCallerIdentity"
    ]

    resources = ["*"]

  }

  statement {
    sid     = "DescribeFunctionsInRegion"
    effect  = "Allow"

    actions = [
      "lambda:GetFunction"
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values = [var.aws_region]
    }
  }

}

resource "aws_iam_role_policy" "lambda_execution_policy" {
  count  = var.logs_enabled ? 1 : 0
  name   = "${var.project_name}-lambda-function-execution-policy"
  role   = aws_iam_role.lambda_role[count.index].id
  policy = data.aws_iam_policy_document.lambda_execution[count.index].json
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/functions/demo.py"
  output_path = "${path.module}/lambda-archives/package.zip"
}

resource "aws_iam_role" "lambda_role" {
  count              = var.logs_enabled ? 1 : 0
  name               = "${var.project_name}-lambda-function-role"
  assume_role_policy = data.aws_iam_policy_document.lambda.json
}

resource "aws_lambda_function" "lambda" {
  count            = var.logs_enabled ? 1 : 0
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-lambda-function"
  role             = aws_iam_role.lambda_role[count.index].arn
  handler          = "demo.lambda_handler"
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)
  runtime          = "python3.8"
  timeout          = 30

  environment {
    variables = {
      PROJECT_NAME  = var.project_name
      FUNCTION_NAME = "${var.project_name}-lambda-function"
    }
  }

  depends_on = [
    data.archive_file.lambda_zip
  ]

}

resource "aws_cloudwatch_event_rule" "every_two_hours" {
  count               = var.logs_enabled ? 1 : 0
  name                = "${var.project_name}-every-two-hours"
  description         = "Fires every 2 hours"
  schedule_expression = "rate(2 hours)"
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  count         = var.logs_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda[count.index].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_two_hours[count.index].arn
}

resource "aws_cloudwatch_event_target" "cloudwatch_event" {
  count     = var.logs_enabled ? 1 : 0
  rule      = aws_cloudwatch_event_rule.every_two_hours[count.index].name
  target_id = "${var.project_name}-snapshot-retention-target"
  arn       = aws_lambda_function.lambda[count.index].arn
}

// CloudWatch Logs
resource "aws_cloudwatch_log_group" "cloudwatch_log_group" {
  count     = var.logs_enabled ? 1 : 0
  name      = "/aws/lambda/${aws_lambda_function.lambda[count.index].function_name}"
  retention_in_days = 5
}

resource "aws_iam_role_policy_attachment" "lambda_exec_policy" {
  count      = var.logs_enabled ? 1 : 0
  role       = aws_iam_role.lambda_role[count.index].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

The next one will be the `modules/lambda-function/variables.tf`:

```
variable "aws_region" {
  default = "eu-west-1"
  type    = string
}

variable "project_name" {
  default = "example"
  type    = string
}

variable "logs_enabled" {
  default = false
  type    = bool
}
```

Then define the modules output in `modules/lambda-function/outputs.tf`:

```
output "arn_string" {
  value = aws_lambda_function.lambda[*].arn
}
```

Then we define our python function code in `modules/lambda-function/functions/demo.py`:

```python
import os
import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    client = boto3.client('lambda')
    logger.info(event)

    response = client.get_function(
        FunctionName=os.environ['FUNCTION_NAME']
    )

    logger.info(response)

    return {
        'statusCode' : 200,
        'body': response
    }
```

For our environment we want to specify the source as our module in `environment/test/main.tf`:

```
module "myfunction" {
  source       = "../../modules/lambda-function"
  project_name = "test"
  logs_enabled = true
}
```

Our outputs in `environment/test/output.tf`:

```
output "arn_string" {
  value = module.myfunction.arn_string
}
```

And since we are using AWS, we need to define our providers and the profile that we will use to authenticate against AWS, in my case, im using the default profile in `environment/test/provider.tf`:

```
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "4.23.0"
    }
  }
}

provider "aws" {
  region                   = "eu-west-1"
  profile                  = "default"
  shared_credentials_files = ["~/.aws/credentials"]
}
```

## Terraform Plan

Now that we have defined our terraform code we can run:

```bash
terraform plan
```

And it should return something more or less like the following:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # module.myfunction.aws_cloudwatch_event_rule.every_two_hours[0] will be created
  + resource "aws_cloudwatch_event_rule" "every_two_hours" {
      + arn                 = (known after apply)
      + description         = "Fires every 2 hours"
      + event_bus_name      = "default"
      + id                  = (known after apply)
      + is_enabled          = true
      + name                = "test-every-two-hours"
      + name_prefix         = (known after apply)
      + schedule_expression = "rate(2 hours)"
      + tags_all            = (known after apply)
    }

  # module.myfunction.aws_cloudwatch_event_target.cloudwatch_event[0] will be created
  + resource "aws_cloudwatch_event_target" "cloudwatch_event" {
      + arn            = (known after apply)
      + event_bus_name = "default"
      + id             = (known after apply)
      + rule           = "test-every-two-hours"
      + target_id      = "test-snapshot-retention-target"
    }

  # module.myfunction.aws_cloudwatch_log_group.cloudwatch_log_group[0] will be created
  + resource "aws_cloudwatch_log_group" "cloudwatch_log_group" {
      + arn               = (known after apply)
      + id                = (known after apply)
      + name              = "/aws/lambda/test-lambda-function"
      + retention_in_days = 5
      + tags_all          = (known after apply)
    }

  # module.myfunction.aws_iam_role.lambda_role[0] will be created
  + resource "aws_iam_role" "lambda_role" {
      + arn                   = (known after apply)
      + assume_role_policy    = jsonencode(
            {
              + Statement = [
                  + {
                      + Action   = "sts:GetCallerIdentity"
                      + Effect   = "Allow"
                      + Resource = "*"
                      + Sid      = "GetCallerIdentity"
                    },
                  + {
                      + Action    = "lambda:GetFunction"
                      + Condition = {
                          + StringEquals = {
                              + "aws:RequestedRegion" = "eu-west-1"
                            }
                        }
                      + Effect    = "Allow"
                      + Resource  = "*"
                      + Sid       = "DescribeFunctionsInRegion"
                    },
                ]
              + Version   = "2012-10-17"
            }
        )
      + create_date           = (known after apply)
      + force_detach_policies = false
      + id                    = (known after apply)
      + managed_policy_arns   = (known after apply)
      + max_session_duration  = 3600
      + name                  = "test-lambda-function-role"
      + name_prefix           = (known after apply)
      + path                  = "/"
      + tags_all              = (known after apply)
      + unique_id             = (known after apply)
    }

  # module.myfunction.aws_iam_role_policy.lambda_execution_policy[0] will be created
  + resource "aws_iam_role_policy" "lambda_execution_policy" {
      + id     = (known after apply)
      + name   = "test-lambda-function-execution-policy"
      + policy = jsonencode(
            {
              + Statement = [
                  + {
                      + Action   = "sts:GetCallerIdentity"
                      + Effect   = "Allow"
                      + Resource = "*"
                      + Sid      = "GetCallerIdentity"
                    },
                  + {
                      + Action    = "lambda:GetFunction"
                      + Condition = {
                          + StringEquals = {
                              + "aws:RequestedRegion" = "eu-west-1"
                            }
                        }
                      + Effect    = "Allow"
                      + Resource  = "*"
                      + Sid       = "DescribeFunctionsInRegion"
                    },
                ]
              + Version   = "2012-10-17"
            }
        )
      + role   = (known after apply)
    }

  # module.myfunction.aws_iam_role_policy_attachment.lambda_exec_policy[0] will be created
  + resource "aws_iam_role_policy_attachment" "lambda_exec_policy" {
      + id         = (known after apply)
      + policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      + role       = "test-lambda-function-role"
    }

  # module.myfunction.aws_lambda_function.lambda[0] will be created
  + resource "aws_lambda_function" "lambda" {
      + architectures                  = (known after apply)
      + arn                            = (known after apply)
      + filename                       = "../../modules/lambda-function/lambda-archives/package.zip"
      + function_name                  = "test-lambda-function"
      + handler                        = "demo.lambda_handler"
      + id                             = (known after apply)
      + invoke_arn                     = (known after apply)
      + last_modified                  = (known after apply)
      + memory_size                    = 128
      + package_type                   = "Zip"
      + publish                        = false
      + qualified_arn                  = (known after apply)
      + reserved_concurrent_executions = -1
      + role                           = (known after apply)
      + runtime                        = "python3.8"
      + signing_job_arn                = (known after apply)
      + signing_profile_version_arn    = (known after apply)
      + source_code_hash               = "MI7FD/KHgxRFh7cmPjzxg+w494pmyRGgQIr9Ls8Yups="
      + source_code_size               = (known after apply)
      + tags_all                       = (known after apply)
      + timeout                        = 30
      + version                        = (known after apply)

      + environment {
          + variables = {
              + "FUNCTION_NAME" = "test-lambda-function"
              + "PROJECT_NAME"  = "test"
            }
        }
    }

  # module.myfunction.aws_lambda_permission.allow_cloudwatch[0] will be created
  + resource "aws_lambda_permission" "allow_cloudwatch" {
      + action              = "lambda:InvokeFunction"
      + function_name       = "test-lambda-function"
      + id                  = (known after apply)
      + principal           = "events.amazonaws.com"
      + source_arn          = (known after apply)
      + statement_id        = "AllowExecutionFromCloudWatch"
      + statement_id_prefix = (known after apply)
    }

Plan: 8 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + arn_string = [
      + (known after apply),
    ]
```

## Create Resources

If you are happy with the plan you can go ahead and run:

```
terraform apply
```

Which will create the resources in AWS. Upon creation we should see something like this:

```
Apply complete! Resources: 0 added, 1 changed, 0 destroyed.

Outputs:

arn_string = [
  "arn:aws:lambda:eu-west-1:000000000000:function:test-lambda-function",
]
```

Since we have our aws cli configured with a profile we can also test our lambda function:

```bash
$ aws --profile default lambda invoke --function-name test-lambda-function --cli-binary-format raw-in-base64-out --payload '{"name": "ruan"}' out.log
{
    "StatusCode": 200,
    "ExecutedVersion": "$LATEST"
}
```

And the response from the invocation can be seen in the file we defined:

```bash
$ cat out.log
{"statusCode": 200, "body": {"ResponseMetadata": {"RequestId": "5171x", "HTTPStatusCode": 200, "HTTPHeaders": {"date": "Thu, 21 Dec 2023 06:34:13 GMT", "content-type": "application/json", "content-length": "3517", "connection": "keep-alive", "x-amzn-requestid": "5171x"}, "RetryAttempts": 0}, "Configuration": {"FunctionName": "test-lambda-function", "FunctionArn": "arn:aws:lambda:eu-west-1:000000000000:function:test-lambda-function", "Runtime": "python3.8", "Role": "arn:aws:iam::000000000000:role/test-lambda-function-role", "Handler": "demo.lambda_handler", "CodeSize": 401, "Description": "", "Timeout": 30, "MemorySize": 128, "LastModified": "2023-12-21T06:26:46.000+0000", "CodeSha256": "x", "Version": "$LATEST", "Environment": {"Variables": {"FUNCTION_NAME": "test-lambda-function", "PROJECT_NAME": "test"}}, "TracingConfig": {"Mode": "PassThrough"}, "RevisionId": "7faex", "State": "Active", "LastUpdateStatus": "Successful", "PackageType": "Zip", "Architectures": ["x86_64"], "EphemeralStorage": {"Size": 512}, "SnapStart": {"ApplyOn": "None", "OptimizationStatus": "Off"}, "RuntimeVersionConfig": {"RuntimeVersionArn": "arn:aws:lambda:eu-west-1::runtime:x"}}, "Code": {"RepositoryType": "S3", "Location": "https://awslambda-eu-west-1-tasks.s3.eu-west-1.amazonaws.com/snapshots/x/test-lambda-function-x?queryparameters"}}}
```

## Updating Lambda Function Code

If we want to redeploy our function with updated code, we can change the content of `functions/demo.py` and then run:

```
terraform apply
```

Since our terraform code defined that if the source has of the function code changes, it will trigger a redeploy, and from the computed plan we can see that it will redeploy our function code:

```bash
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  ~ update in-place

Terraform will perform the following actions:

  # module.myfunction.aws_lambda_function.lambda[0] will be updated in-place
  ~ resource "aws_lambda_function" "lambda" {
        id                             = "test-lambda-function"
      ~ last_modified                  = "2023-12-21T06:26:46.000+0000" -> (known after apply)
      ~ source_code_hash               = "8TLrm4GmTrfAxwfElmIjws1Vf9UDZ6k2w1+VEONJaCQ=" -> "RIQ62KCcjlcHh5lLCOlrkB7GioBpLY1Y5vN4UZGyN+c="
        tags                           = {}
        # (18 unchanged attributes hidden)

        # (3 unchanged blocks hidden)
    }

Plan: 0 to add, 1 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

After entering "yes" we will update our function code

## Discover AWS Console

If we logon to the AWS Console and head to Lambda we can inspect our function code:

![image](https://github.com/ruanbekker/ruanbekker/assets/567298/2326b074-fa5b-443c-8715-59451293ccb2)

If we manually want to trigger the function, select "Test", then enter the "Event name" with something like "testing" then click "Test":

![image](https://github.com/ruanbekker/ruanbekker/assets/567298/76bcde33-185f-47ed-a70c-4d967df80e92)

If we follow the CloudWatch log link we can view the logs in CloudWatch:

![image](https://github.com/ruanbekker/ruanbekker/assets/567298/f5483602-3144-48ce-98bf-d50f625cdd92)

## Destroy Infrastructure

If you followed along and would like to destroy the created infrastructure:

```bash
terraform destroy
```

## Resources

Terraform Examples

- https://github.com/ruanbekker/terraformfiles/tree/master/modules/aws-lambda-function

## Thank You

Thanks for reading, feel free to check out my [website](https://ruan.dev/), feel free to subscribe to my [newsletter](http://digests.ruanbekker.com/?via=ruanbekker-blog) or follow me at [@ruanbekker](https://twitter.com/ruanbekker) on Twitter.

- Linktree: https://go.ruan.dev/links
- Patreon: https://go.ruan.dev/patreon


