# Api-Gate with async call to sqs and lambda worker
Exposed Rest-API with Api-Gateway. Sends message to SQS-Queue and
responses async to caller. Worker-Lambda gets message from SQS

![API-Gateway with Lambda-Integration](images/apigate-sqs-lambda.png)

The `apigateWithStepfunction.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `apigateWithStepfunction deploy`      deploy this stack to your default AWS account/region
* `apigateWithStepfunction diff`        compare deployed stack with current state
* `apigateWithStepfunction synth`       emits the synthesized CloudFormation template
