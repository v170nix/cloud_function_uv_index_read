import {Driver, getCredentialsFromEnv, RetryParameters, Session, TypedValues, withRetries} from "ydb-sdk";
import {UVQuery} from "./UVQuery";
import {Result} from "./data-helpers";
import {floorNearest, roundNearest} from "../lib/utils";

export class UVRepository {

    private static TABLE_NAME = 'uvi_table';
    private static TIMEOUT = 3000;
    private static DB_LAT_RANGE = 95;
    private static DB_LON_RANGE = 900;


    private static query = `
DECLARE $lat AS INT32;
DECLARE $lon AS UINT32;
DECLARE $datetime AS Datetime;

SELECT dt, JSON_VALUE(uvi, "$[__pos__]" RETURNING Uint16) AS uvi
FROM ${UVRepository.TABLE_NAME}
WHERE lat == $lat AND lon == $lon AND dt >= $datetime
;`;

    private constructor(readonly driver: Driver) {
    }

    static async createInstance(endpoint: string, database: string): Promise<UVRepository> {
        const driver = new Driver({
            endpoint: endpoint,
            database: database,
            authService: getCredentialsFromEnv()
        });
        if (!await driver.ready(UVRepository.TIMEOUT)) {
            throw Error('Inner driver error');
        }
        return new UVRepository(driver);

    }

    async getResult(request: UVQuery): Promise<Result[]> {
        return  await this.driver.tableClient.withSession(async (session) => {
            return await this.readTable(session, request);
        }, UVRepository.TIMEOUT);
    }

    private async readTable(session: Session, request: UVQuery): Promise<Result[]> {
        const q = UVRepository.query.replace("__pos__", UVRepository.getDataIndex(request).toString());
        async function select(): Promise<Result[]> {
            const preparedQuery = await session.prepareQuery(q);
            const {resultSets} = await session.executeQuery(preparedQuery, {
                '$datetime': TypedValues.datetime(request.date),
                '$lat': TypedValues.int32(UVRepository.getDbRequestLat(request)),
                '$lon': TypedValues.uint32(UVRepository.getDbRequestLon(request)),
            });
            const result = Result.createNativeObjects(resultSets[0])
            return result as Result[]
        }
        return await withRetries(select, new RetryParameters({maxRetries: 4}));
    }

    private static getDbRequestLat(request: UVQuery): number {
        const x = 901 - roundNearest(request.lat * 10, 5);
        return 901 - floorNearest(x, UVRepository.DB_LAT_RANGE) - UVRepository.DB_LAT_RANGE;
    }

    private static getDbRequestLon(request: UVQuery): number {
        const x = roundNearest(request.lng * 10 , 5);
        return floorNearest(x, UVRepository.DB_LON_RANGE);
    }

    private static getDataIndex(request: UVQuery): number {
        const lat = roundNearest((UVRepository.getDbRequestLat(request) + UVRepository.DB_LAT_RANGE), 5);
        const lon = roundNearest(UVRepository.getDbRequestLon(request), 5);
        const requestRoundLat = roundNearest(request.lat * 10, 5);
        const requestRoundLon = roundNearest(request.lng * 10 , 5);
        const y = Math.abs(lat - requestRoundLat) / 5;
        const x = (requestRoundLon - lon) / 5;
        return y * UVRepository.DB_LON_RANGE / 5 + x
    }

    async close() {
        try {
            await this.driver.destroy();
        } catch (i) {
        }
    }

}