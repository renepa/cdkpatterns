import {Context} from "aws-cdk/lib/settings";
import {APIGatewayEvent, APIGatewayProxyCallback} from "aws-lambda";

exports.handler = async function(event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) {
    console.log('"request:", JSON.stringify(event, undefined, 2)')
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `Hello from Handler 1: ${event.path}`
    };
}