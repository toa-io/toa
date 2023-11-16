// noinspection ES6UnusedImports

import type {
    Document,
    Filter,
    FindOneAndReplaceOptions,
    FindOneAndUpdateOptions,
    FindOptions,
    UpdateFilter
} from 'mongodb'

import type { Connector } from '@toa.io/core'
import type { Record } from './record'

declare namespace toa.mongodb {

    interface Connection extends Connector {
        get(query: Filter<Record>, options?: FindOptions<Record>): Promise<Record>

        find(query: Filter<Record>, options?: FindOptions<Record>): Promise<Record[]>

        add(records: Record[]): Promise<boolean>

        replace(query: Filter<Record>, record: UpdateFilter<Record>, options?: FindOneAndReplaceOptions): Promise<any>

        update(query: Filter<Record>, update: UpdateFilter<Record>, options?: FindOneAndUpdateOptions): Promise<any>
    }

}
