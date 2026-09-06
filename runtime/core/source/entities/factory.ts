import { newid } from './newid.js'
import { Entity } from './entity.js'
import { EntitySet } from './set.js'
import { Changeset } from './changeset.js'
import type { Schema } from '@toa.io/schemas'
import type { Guard } from '../guard.js'
import type { Query, Record } from '../types/storages.js'

/** The two schemas a component's records are held to, and what a new one starts as. */
export interface Schemas {
  /** what a stored record must fit */
  entity: Schema

  /** what a changeset must fit: the same properties, none of them required */
  changeset: Schema
}

export class Factory {
  readonly #schemas: Schemas
  readonly #blank: object
  readonly #guards: Guard[] | undefined

  public constructor (schemas: Schemas, blank: object, guards?: Guard[]) {
    this.#schemas = schemas
    this.#blank = blank
    this.#guards = guards
  }

  public fit (values: object): void {
    this.#schemas.entity.validate({ id: newid(), ...this.#blank, ...values }, 'Entity')
  }

  public init (id?: string): Entity {
    return new Entity(this.#schemas.entity, this.#blank, id, this.#guards)
  }

  public object (record: Record, mutable = true): Entity {
    return new Entity(this.#schemas.entity, this.#blank, record, this.#guards, mutable)
  }

  public objects (recordset: Record[], init?: string[], mutable = true): EntitySet {
    const set = recordset.map((record) => this.object(record, mutable))

    if (init !== undefined) 
      for (const id of init)
        set.unshift(this.init(id))

    return new EntitySet(set)
  }

  public changeset (query: Query): Changeset {
    return new Changeset(this.#schemas.changeset, query)
  }
}
