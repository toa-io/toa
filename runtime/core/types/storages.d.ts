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
    // entity observation
    get?(query: Query): Promise<Entity | null>

    // set observation
    find?(query: Query): Promise<Entity[]>

    add?(entity: Entity): Promise<boolean>

    set?(entity: Entity): Promise<boolean>

    // commit
    store?(entity: Entity): Promise<boolean>

    // assignment
    upsert?(query: Query, changeset: Object, insert: Entity): Promise<Entity>
  }

  interface Migration {

    disconnect(): Promise<void>

    database(name: string): Promise<void>

    table(database: string, locator: Locator, schema: Object): Promise<void>

  }

  interface Factory {

    storage(locator: Locator): Storage

    migration(driver?: string): Migration

  }

}

export type Entity = toa.core.storages.Entity
export type Factory = toa.core.storages.Factory
export type Storage = toa.core.storages.Storage
export type Query = toa.core.storages.Query
export type Migration = toa.core.storages.Migration
