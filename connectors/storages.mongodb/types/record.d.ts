declare namespace toa.mongodb {

    interface Record {
        _id: string | any
        _version: number
    }

}

export type Record = toa.mongodb.Record
