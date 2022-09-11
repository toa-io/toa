// noinspection ES6UnusedImports

import { Locator } from './locator'
import { Connector } from './connector'

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
      options?: Object
    }

    interface Migration {
      disconnect(): Promise<void>

      database(name: string): Promise<void>

      table(database: string, locator: Locator, schema: Object, reset?: boolean): Promise<string>
    }

    interface Factory {
      storage(locator: Locator): Storage

      migration(driver?: string): Migration
    }
  }

  interface Storage extends Connector {
    // object observation
    get?(query: storages.Query): Promise<storages.Record | null>

    // objects observation
    find?(query: storages.Query): Promise<storages.Record[]>

    // commit
    store?(record: storages.Record): Promise<boolean>

    // assignment
    upsert?(query: storages.Query, changeset: Object, insert: storages.Record): Promise<storages.Record>
  }

}

export type Storage = toa.core.Storage
export type Record = toa.core.storages.Record
export type Factory = toa.core.storages.Factory
export type Query = toa.core.storages.Query
export type Migration = toa.core.storages.Migration
