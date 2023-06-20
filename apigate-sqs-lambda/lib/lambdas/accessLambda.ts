import {APIGatewayEvent, SQSEvent} from 'aws-lambda';
import {log} from "./logger";

export const handler = async (event: SQSEvent): Promise<any> => {
    log(event)
    return {
        "statusCode": 200,
        "body": JSON.stringify(
            {
                responseMessage: "Das hat geklappt"
            }
        )
    }
}