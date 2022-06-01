declare namespace toa.extensions.resources.definitions {

    interface Operation {
        type: 'transition' | 'observation' | 'assignment'
        query: boolean
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
}

export type Node = toa.extensions.resources.definitions.Node
export type Operation = toa.extensions.resources.definitions.Operation
