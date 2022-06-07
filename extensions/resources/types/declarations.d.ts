declare namespace toa.extensions.resources.declarations {

    interface Operation {
        operation: string
        type: 'transition' | 'observation' | 'assignment'
        subject: 'entity' | 'set'
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
        domain: string
        name: string
        resources: Node
    }
}

export type Node = toa.extensions.resources.declarations.Node
export type Operation = toa.extensions.resources.declarations.Operation
