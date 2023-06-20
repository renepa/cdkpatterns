import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AwsIntegration, IResource, MockIntegration, PassthroughBehavior, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {ApigateWithLambdaStack} from "./apigate-with-lambda-stack";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

// Quelle: https://sbstjn.com/blog/aws-cdk-api-gateway-service-integration-sqs/
export class ApigateSqsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const messageQueue = new Queue(this, "Queue");

    const credentialsRole = new Role(this, "Role", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });

    credentialsRole.attachInlinePolicy(
        new Policy(this, "SendMessagePolicy", {
          statements: [
            new PolicyStatement({
              actions: ["sqs:SendMessage"],
              effect: Effect.ALLOW,
              resources: [messageQueue.queueArn],
            }),
          ],
        })
    );

    const sqsIntegration = new AwsIntegration({
      service: "sqs",
      path: `${cdk.Aws.ACCOUNT_ID}/${messageQueue.queueName}`,
      integrationHttpMethod: "POST",
      options: {
        credentialsRole,
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestParameters: {
          "integration.request.header.Content-Type": `'application/x-www-form-urlencoded'`,
        },
        requestTemplates: {
          "application/json": `Action=SendMessage&MessageBody=$util.escapeJavaScript($input.json('$'))`,
        },
        integrationResponses: [
          {
            selectionPattern: "200",
            statusCode: "200",
            responseTemplates: {
              "application/json": `{"done": true}`,
            },
          },
        ],
      },
    });

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'Item Api', {
      restApiName: 'Item Api'
    });

    const items = api.root.addResource('items');
    items.addMethod('POST', sqsIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Origin": true
          }
        }
      ]
    });
    addCorsOptions(items);

    const accessLambda = new NodejsFunction(this, 'PostFunction', {
      functionName: "AccessLambda_ApiSqsLambda",
      runtime: Runtime.NODEJS_16_X,
      // name of the exported function
      handler: 'handler',
      // file to use as entry point for our Lambda function
      entry: __dirname + '/lambdas/accessLambda.ts',
      environment: {
      },
      bundling: {
        // This is the configuration you need to use to include the exact
        // aws-sdk version from your `package.json` file.
        externalModules: [],
      },
    });

    accessLambda.addEventSource(new SqsEventSource(messageQueue))

  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}
