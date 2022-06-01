// noinspection ES6UnusedImports

import type { Method } from './http'
import type { Query } from './query'
import type { Operation } from './definitions'

declare namespace toa.extensions.resources {

    interface Node {
        route: string
        match: (route: string) => boolean
        operations: Record<Method, Operation>
        query: Query
    }

}

