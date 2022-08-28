declare namespace toa.extensions.exposition.declarations {

  interface Operation {
    operation: string
    type: 'transition' | 'observation' | 'assignment'
    scope: 'object' | 'objects' | 'changeset'
    query?: boolean
  }

  interface Query {
    criteria?: string
    sort?: string[]
    projection?: string[]
  }

  type Node = {
    query?: Query
    operations?: Operation[]
  } & {
    [key: string]: Node
  }

  interface Exposition {
    namespace: string
    name: string
    resources: Node
  }
}

export type Node = toa.extensions.exposition.declarations.Node
export type Operation = toa.extensions.exposition.declarations.Operation
