import {APIGatewayEvent, SQSEvent, SQSRecord} from "aws-lambda";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

export function log(sqsRecords: SQSEvent) {
    sqsRecords.Records.forEach(logSqsRecord)
}

function logSqsRecord(record: SQSRecord) {
    console.log(record)
}