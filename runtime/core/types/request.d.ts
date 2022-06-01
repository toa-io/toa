declare namespace toa.core {

    namespace request {

        interface Query {
            id?: string
            criteria?: string
            omit?: number
            limit?: number
            sort?: Array<string>
            projection?: Array<string>
            version?: number
        }

    }

    interface Request {
        input?: Object
        query?: request.Query
    }

}

export type Request = toa.core.Request
export type Query = toa.core.request.Query
