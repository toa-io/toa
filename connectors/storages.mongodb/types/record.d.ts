declare namespace toa.mongodb {

    interface Record {
        _id: string
        VERSION: number

        [key: string]: any
    }

}

export type Record = toa.mongodb.Record
