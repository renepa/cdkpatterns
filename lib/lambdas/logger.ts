import {APIGatewayEvent} from "aws-lambda";

export function logBodyOf(event: APIGatewayEvent) {
    console.log(JSON.stringify(event.body))
}

export function logHeadersOf(event: APIGatewayEvent) {
    console.log(JSON.stringify(event.headers))
}