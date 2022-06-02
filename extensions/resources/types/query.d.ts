import type { Query as RequestQuery } from '@toa.io/core/types/request'
import type { Node, Operation } from './declarations'

declare namespace toa.extensions.resources {

    namespace query {
        type Constructor = (node: Node) => Query
    }

    interface Query {
        parse(query: RequestQuery, operation: Operation): RequestQuery
    }

}

export type Query = toa.extensions.resources.Query
