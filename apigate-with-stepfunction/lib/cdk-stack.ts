import {Aws, Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Cors, Integration, IntegrationType, PassthroughBehavior, RestApi} from "aws-cdk-lib/aws-apigateway"
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {StateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const startLambda = new Function(this, 'startLambda', {
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler.handler',
      code: Code.fromAsset('lib/lambdas')
    });

    const nextLambda = new Function(this, 'nextLambda', {
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler2.handler',
      code: Code.fromAsset('lib/lambdas')
    });

    // api.root.addMethod('GET', new LambdaIntegration(fn));

    const startTask = new LambdaInvoke(this, 'StartTask', {
      lambdaFunction: startLambda,
      // Lambda's result is in the attribute `Payload`
      outputPath: '$.Payload',
    });

    const nextTask = new LambdaInvoke(this, 'NextTask', {
      lambdaFunction: nextLambda,
      // Lambda's result is in the attribute `Payload`
      outputPath: '$.Payload',
    });

    // Create chain

    const definition = startTask
        .next(nextTask)
    // .next(getStatus)
        // .next(new sfn.Choice(this, 'Job Complete?')
        //     Look at the "status" field
            // .when(sfn.Condition.stringEquals('$.status', 'FAILED'), jobFailed)
            // .when(sfn.Condition.stringEquals('$.status', 'SUCCEEDED'), finalStatus)
            // .otherwise(waitX));
    // Create state machine

    const stateMachine = new StateMachine(this, 'ReneStateMachine', {
      definition,
      stateMachineType: StateMachineType.EXPRESS,
      timeout: Duration.minutes(5),
    });
    const invokeSFNAPIRole = new Role(this, "invokeSFNAPIRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        allowSFNInvoke: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["states:StartSyncExecution", "states:StartExecution"],
              resources: [stateMachine.stateMachineArn]
            })
          ]
        })
      }
    });

    const api = new RestApi(this, "API", {
      defaultCorsPreflightOptions: {
        /**
         * The allow rules are a bit relaxed.
         * I would strongly advise you to narrow them down in your applications.
         */
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["*"],
        allowCredentials: true
      }
    });

    const createPetResource = api.root.addResource("create");
    createPetResource.addMethod(
        "POST",
        new Integration({
          type: IntegrationType.AWS,
          integrationHttpMethod: "POST",
          uri: `arn:aws:apigateway:${Aws.REGION}:states:action/StartSyncExecution`,
          options: {
            credentialsRole: invokeSFNAPIRole,
            passthroughBehavior: PassthroughBehavior.NEVER,
            requestTemplates: {
              "application/json": `{
              "input": "{\\"actionType\\": \\"create\\", \\"body\\": $util.escapeJavaScript($input.json('$'))}",
              "stateMachineArn": "${stateMachine.stateMachineArn}"
            }`
            },
            integrationResponses: [
              {
                selectionPattern: "200",
                statusCode: "201",
                responseTemplates: {
                  "application/json": `
                  #set($inputRoot = $input.path('$'))

                  #if($input.path('$.status').toString().equals("FAILED"))
                    #set($context.responseOverride.status = 500)
                    {
                      "error": "$input.path('$.error')",
                      "cause": "$input.path('$.cause')"
                    }
                  #else
                    {
                      "id": "$context.requestId",
                      "output": "$util.escapeJavaScript($input.path('$.output'))"
                    }
                  #end
                `
                },
                responseParameters: {
                  "method.response.header.Access-Control-Allow-Methods":
                      "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
                  "method.response.header.Access-Control-Allow-Headers":
                      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                  "method.response.header.Access-Control-Allow-Origin": "'*'"
                }
              }
            ]
          }
        }),
        {
          methodResponses: [
            {
              statusCode: "201",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Methods": true,
                "method.response.header.Access-Control-Allow-Headers": true,
                "method.response.header.Access-Control-Allow-Origin": true
              }
            }
          ]
        }
    );

    // Grant lambda execution roles
    startLambda.grantInvoke(stateMachine.role);
    nextLambda.grantInvoke(stateMachine.role);

    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });
    //
    // const topic = new sns.Topic(this, 'CdkTopic');
    //
    // topic.addSubscription(new subs.SqsSubscription(queue);
  }
}
