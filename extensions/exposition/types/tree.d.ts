// noinspection ES6UnusedImports

import type * as declarations from './declarations'
import type { Method } from './http'
import type { Query } from './query'
import type { Match as PathMatch } from 'path-to-regexp'

declare namespace toa.extensions.exposition {

  namespace tree {

    interface Node {
      route: string
      match: (route: string) => PathMatch<object>
      operations: Record<Method, declarations.Operation>
      query: Query
    }

    interface Match {
      node: Node
      params: Record<string, string>
    }

  }

  interface Tree {
    match(path: string): tree.Match

    update(tree: declarations.Node): void
  }

}
