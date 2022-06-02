// noinspection ES6UnusedImports

import { Locator } from './locator'
import { Connector } from './connector'

declare namespace toa.core.storages {

    namespace ast {

        interface Node {
            type: 'LOGIC' | 'COMPARISON' | 'SELECTOR' | 'VALUE'
            left?: Node
            right?: Node
            operator?: string
            selector?: string
            value?: string
        }

    }

    interface Entity {
        id: string
        _version: number

        [key: string]: any
    }

    interface Query {
        id?: string
        version?: number
        criteria?: ast.Node
        options?: Object
    }

    interface Storage extends Connector {
        get?(query: Query): Promise<Entity>

        find?(query: Query): Promise<Entity[]>

        add?(entity: Entity): Promise<boolean>

        set?(entity: Entity): Promise<boolean>

        store?(entity: Entity): Promise<boolean>

        upsert?(query: Query, changeset: Object, insert: Entity): Promise<Entity>
    }

    interface Factory {
        storage(locator: Locator): Storage
    }

}

export type Query = toa.core.storages.Query
