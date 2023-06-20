# Api-Gate with async call to sqs and lambda worker
Exposed Rest-API with Api-Gateway. Sends message to SQS-Queue and
responses async to caller. Worker-Lambda gets message from SQS

![API-Gateway with Lambda-Integration](images/apigate-sqs-lambda.png)

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
