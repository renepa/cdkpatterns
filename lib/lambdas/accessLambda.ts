import {APIGatewayEvent} from 'aws-lambda';
import {MultipartFile, MultipartRequest, parse} from 'lambda-multipart-parser'
import {S3} from 'aws-sdk'

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log(JSON.stringify(event.body))

    const multiparts = await getFilesIfExist(event);
    for (const file of multiparts.files) {
        await putFileInS3(file)
    }

    console.log(JSON.stringify(multiparts))

    return {
        "statusCode": 200,
        "body": JSON.stringify(
            {
                responseMessage: "Das hat geklappt"
            }
        )
    }
}

async function getFilesIfExist(event: APIGatewayEvent): Promise<MultipartRequest> {
    try {
        const multiparts = await parse(event);
        console.log("File-Result: " + multiparts.files)
        return multiparts
    } catch (error) {
        console.log('Error while parse multiparts: '+error.message)
        throw new Error('Error while pars Multipart')
    }
}

async function putFileInS3(file: MultipartFile) {
    var s3 = new S3({
        apiVersion: '2006-03-01',
    });

    console.log('Put file ' + file.filename + ' into bucket')
    await s3.upload({
        Bucket: "rp12-fileuploadbucket",
        Key: file.filename,
        Body: file.content,
    }, (err: any, data: S3.Types.PutObjectOutput) => {
        if (err) {
            console.error('Code:' + err.code + ' Message: ' + err.message)
        } else {
            console.log('Object put into bucket - no error')
        }
    }).promise()
}
