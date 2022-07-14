declare namespace toa.mongodb {

    interface Record {
        _id: string
        _version: number

        [key: string]: any
    }

}

export type Record = toa.mongodb.Record
