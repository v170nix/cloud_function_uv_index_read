import {UVQuery} from "./data/UVQuery";
import {UVRepository} from "./data/UVRepository";

process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS = './iam.key'

module.exports.handler = async function (event) {

    const repository = await UVRepository.createInstance(
        "grpcs://ydb.serverless.yandexcloud.net:2135",
        "/ru-central1/b1gvrbcm42s88dpvsf4t/etnqah3298b4hg4hv81d",
    )

    try {
        console.log(event.queryStringParameters);
        const request = UVQuery.createInstance(event.queryStringParameters.lat, event.queryStringParameters.lon, event.queryStringParameters.dt);
        console.log(request);
        await repository.getResult(request);
        return {
            statusCode: 200,
            body: JSON.stringify(event)
        }
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify(e.message)
        }
    } finally {
        await repository.close();
    }
}

module.exports.handler({
    queryStringParameters: {
        lat: -30.69868,
        // lat: -24.69868,
        // lat: 90,
        lon: 122.0593
    }
}).then((r) => {
    console.log(r);
    console.log("end");
})