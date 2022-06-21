import {UVQuery} from "./UVQuery";
import {
    Driver,
    getCredentialsFromEnv,
    ReadTableSettings,
    RetryParameters,
    Session,
    TypedValues,
    withRetries
} from "ydb-sdk";
import {Result} from "./data-helpers";

const TABLE_NAME = 'uvi_table';

export async function dataReader(endpoint: string, database: string, request: UVQuery) {
    const driver = new Driver({
        endpoint: endpoint,
        database: database,
        authService: getCredentialsFromEnv()
    });
    if (!await driver.ready(5000)) {
        throw Error("Inner error");
    }
    await driver.tableClient.withSession(async (session) => {
        await readTable(session, request);
    }, 2000);
    await driver.destroy();
}

async function readTable(session: Session, request: UVQuery) {

    const  query = `
DECLARE $datetime AS Datetime;

SELECT dt, JSON_VALUE(uvi, "$[0]") AS uvi
FROM ${TABLE_NAME}
WHERE lat == -49 AND lon == 0 AND dt > $datetime
;`;

    async function select() {
        const preparedQuery = await session.prepareQuery(query);
        const {resultSets} = await session.executeQuery(preparedQuery, {
            '$datetime': TypedValues.datetime(request.date)
        });

        const result = Result.createNativeObjects(resultSets[0])

        console.log("result", result);

    }

    await withRetries(select, new RetryParameters({maxRetries: 4}));
}
