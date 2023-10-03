# Welcome to example for direct integration of stepfunctions with api gateway

In this example an api is privisioned to start a simple stepfunction. You have the chance to configure it as standard or express, asynchronous or sychron.
Inspiration and more information: https://dev.to/aws-builders/api-gateway-rest-api-step-functions-direct-integration-aws-cdk-guide-13c4

All ressources like StepFunctoin, API-Gateway etc. are defined with CDK

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk destroy`     undeploy this stack from your default AWS account/region

## Configuration
### Express vs. Standard
To define the StepFunction Standard or Express use the stateMachineType - Parameter in the statemachine ressource definition in cdk.ts.
```
const stateMachine = new StateMachine(this, 'ReneStateMachine', {
      definition,
      stateMachineType: StateMachineType.EXPRESS,
      timeout: Duration.minutes(5),
    });
```
### Synchron vs. Asynchron
When you call a stepfunction synchron in this example the output of the handler2 is mapped to the response of the rest-call. In the asynchounous case the answer is only the execution id with an empty response message. To define synchron or asynchron calls you have to define the uri in the integration in the method added to the ´create`-ressource in the api-gateway.
Use ../StartSyncExecution for synchron execution and .../StartExecution for asynchronous execution.
