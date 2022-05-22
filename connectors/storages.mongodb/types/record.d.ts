declare namespace toa.storages.mongo {

    interface Record {
        _id: string | any
        _version: number
    }

}

export type Record = toa.storages.mongo.Record
