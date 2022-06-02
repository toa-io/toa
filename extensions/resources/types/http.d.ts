import type * as express from 'express'

declare namespace toa.extensions.resources.http {
    type Method = 'GET' | 'POST' | 'PUT' | 'PATCH'

    interface Request extends express.Request {
    }

    interface Response extends express.Response {
    }
}

export type Method = toa.extensions.resources.http.Method
