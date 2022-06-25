import {UVQuery} from "./data/UVQuery";
import {UVRepository} from "./data/UVRepository";

process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS = './iam.key'

module.exports.handler = async function (event) {

    const repository = await UVRepository.createInstance(
        "grpcs://ydb.serverless.yandexcloud.net:2135",
        "/ru-central1/b1gvrbcm42s88dpvsf4t/etnqah3298b4hg4hv81d",
    )

    try {
        const request = UVQuery.createInstance(event.queryStringParameters.lat, event.queryStringParameters.lon, event.queryStringParameters.dt);
        const result = await repository.getResult(request);
        return {
            statusCode: 200,
            headers: {"content-type": "application/json"},
            body: JSON.stringify({
                    status: "OK",
                    indices: result
                }
            )
        }
    } catch (e) {
        return {
            statusCode: 400,
            headers: {"content-type": "application/json"},
            body: JSON.stringify({
                status: 'ERROR',
                message: e.message
            })
        }
    } finally {
        // await repository.close();
    }
}

// module.exports.handler({
//     queryStringParameters: {
//         lat: 0.1,
//         lon: 179.5,
//         dt: "2022-06-26T23:00:00.000Z"
//     }
// }).then((r) => {
//     console.log(r);
//     console.log("end");
// })