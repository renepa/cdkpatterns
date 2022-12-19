import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Bucket, IBucketNotificationDestination} from "aws-cdk-lib/aws-s3";
import {LambdaDestination} from "aws-cdk-lib/aws-s3-notifications";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApigateWithLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'uploads', {
      restApiName: 'File upload'
    });

    const accessLambda = new NodejsFunction(this, 'PostFunction', {
      functionName: "FileUploadAccessLambda",
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

    const accessLambdaIntegration = new LambdaIntegration(accessLambda);

    const items = api.root.addResource('items');
    items.addMethod('POST', accessLambdaIntegration);
    addCorsOptions(items);
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
