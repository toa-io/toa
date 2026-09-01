// noinspection ES6UnusedImports

import { Locator } from './locator'
import { Connector } from './connector'
import * as outbox from './outbox'

declare namespace toa.core {

  namespace storages {
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

    interface Record {
      id: string
      _version: number

      [key: string]: any
    }

    interface Query {
      id?: string
      version?: number
      criteria?: ast.Node
      search?: string
      sample?: number
      options?: Object
    }

    interface Migration {
      disconnect (): Promise<void>

      database (name: string): Promise<void>

      table (database: string, locator: Locator, schema: Object, reset?: boolean): Promise<string>
    }

    interface Options {
      /** whether this component publishes anything, and so needs an outbox */
      outbox?: boolean
    }

    interface Factory {
      storage (locator: Locator, properties?: object, options?: Options): Storage

      migration? (driver?: string): Migration
    }
  }

  interface Storage extends Connector {
    // object observation
    get? (query: storages.Query): Promise<storages.Record | null>

    // objects observation
    find? (query: storages.Query): Promise<storages.Record[]>

    // commit
    store? (record: storages.Record, row?: outbox.Row): Promise<boolean>

    // mass commit
    massStore? (records: storages.Record[], rows?: outbox.Row[]): Promise<boolean>

    // assignment
    upsert? (query: storages.Query, changeset: Object, row?: outbox.Row): Promise<storages.Record>

    // atomic get-or-create
    ensure? (query: storages.Query, properties: Object, record: storages.Record, row?: outbox.Row): Promise<storages.Record>

    /**
     * Present only where a row can be committed atomically with the entity. Its absence is
     * what makes the runtime fall back to publishing inline, so a storage that cannot do
     * this must not offer it: a row written outside the transaction would be a second write
     * with a crash window in front of it, which is the defect the outbox exists to close.
     *
     * The row schema is the connector's own — it also owns `pending` and `settle` — and
     * never crosses this boundary.
     */
    outbox?: outbox.Storage
  }

}

export type Storage = toa.core.Storage
export type Record = toa.core.storages.Record
export type Factory = toa.core.storages.Factory
export type Query = toa.core.storages.Query
export type Migration = toa.core.storages.Migration
