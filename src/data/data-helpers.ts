import {declareType, snakeToCamelCaseConversion, TypedData, Types, withTypeOptions} from "ydb-sdk";

export interface IResult {
    dt: Date,
    uvi: number
}

@withTypeOptions({namesConversion: snakeToCamelCaseConversion})
export class Result extends TypedData {

    @declareType(Types.DATETIME)
    public dt: Date;

    @declareType(Types.UINT16)
    public uvi: number;

    constructor(data: IResult) {
        super({
            dt: data.dt,
            uvi: data.uvi / 100
        });
        this.dt = data.dt;
        this.uvi = data.uvi / 100;
    }
}