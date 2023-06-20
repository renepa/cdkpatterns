import {APIGatewayEvent} from 'aws-lambda';
import {logBodyOf, logHeadersOf} from "./logger";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    logBodyOf(event)
    logHeadersOf(event)

    return {
        "statusCode": 200,
        "body": JSON.stringify(
            {
                responseMessage: "Das hat geklappt"
            }
        )
    }
}