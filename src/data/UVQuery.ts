export class UVQuery {

    private constructor(readonly lat: number, readonly lng: number, readonly date: Date) {
    }

    static createInstance(lat: string, lng: string, date: Date|undefined) {
        const innerDate = (date === undefined) ? new Date(Date.now()) : new Date(date);
        if (isNaN(innerDate.getDate())) throw new Error('Invalid Date');
        innerDate.setUTCMinutes(0, 0, 0);
        const innerLat = Number(lat);
        if (isNaN(innerLat)) throw new Error('lat is NaN value');
        if (innerLat < -90 || innerLat > 90) throw new Error('lat is invalid value');
        let innerLng = Number(lng);
        if (isNaN(innerLng)) throw new Error('lon is NaN value');
        if (innerLng < -180 || innerLng > 180) throw new Error('lon is invalid value');
        if (innerLng < 0) {
            innerLng = 360 + innerLng
        }
        return new UVQuery(innerLat, innerLng, innerDate);
    }

}