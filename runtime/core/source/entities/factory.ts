import { newid } from './newid.js'
import { Entity } from './entity.js'
import { EntitySet } from './set.js'
import { Changeset } from './changeset.js'
import type { Schema } from '@toa.io/schemas'
import type { Guard } from '../guard.js'
import type { Query, Record } from '../types/storages.js'

export class Factory {
  readonly #schema: Schema
  readonly #guards: Guard[] | undefined

  public constructor (schema: Schema, guards?: Guard[]) {
    this.#schema = schema
    this.#guards = guards
  }

  public fit (values: object): void {
    this.#schema.validate({ id: newid(), ...values }, 'Entity')
  }

  public init (id?: string): Entity {
    return new Entity(this.#schema, id, this.#guards)
  }

  public object (record: Record, mutable = true): Entity {
    return new Entity(this.#schema, record, this.#guards, mutable)
  }

  public objects (recordset: Record[], init?: string[], mutable = true): EntitySet {
    const set = recordset.map((record) => this.object(record, mutable))

    if (init !== undefined) 
      for (const id of init)
        set.unshift(this.init(id))

    return new EntitySet(set)
  }

  public changeset (query: Query): Changeset {
    return new Changeset(this.#schema, query)
  }
}
