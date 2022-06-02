// noinspection ES6UnusedImports

import type * as definitions from './definitions'
import type { Method } from './http'
import type { Query } from './query'
import type { Match as PathMatch } from 'path-to-regexp'

declare namespace toa.extensions.resources {

    namespace tree {

        interface Node {
            route: string
            match: (route: string) => PathMatch<object>
            operations: Record<Method, definitions.Operation>
            query: Query
        }

        interface Match {
            node: Node
            params: Record<string, string>
        }

    }

    interface Tree {
        match(path: string): tree.Match

        update(tree: definitions.Node): void
    }

}

