import { EntityContractException } from '../exceptions.ts'
import type { Schema } from '@toa.io/schemas'
import type { Query, Record } from '../types/storages.ts'

export class Changeset {
  public readonly query: Query

  /** the changeset schema: the entity's properties, none of them required */
  readonly #schema: Schema
  #state: Record | object

  public constructor(schema: Schema, query: Query) {
    this.query = query

    this.#schema = schema
    this.#state = {}
  }

  public get(): object {
    return this.#state
  }

  public set(value: Record): void {
    const error = this.#schema.fit(value)

    if (error !== null) throw new EntityContractException(error, value)

    delete (value as Partial<Record>).VERSION
    value.UPDATED = Date.now()

    this.#state = value
  }

  public export(): object {
    return this.#state
  }
}
