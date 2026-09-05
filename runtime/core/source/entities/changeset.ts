import { EntityContractException } from '../exceptions.js'
import type { Schema } from '@toa.io/schemas'
import type { Query, Record } from '../types/storages.js'

export class Changeset {
  public readonly query: Query

  readonly #schema: Schema
  #state: Record | object

  public constructor (schema: Schema, query: Query) {
    this.query = query

    this.#schema = schema
    this.#state = {}
  }

  public get (): object {
    return this.#state
  }

  public set (value: Record): void {
    const error = this.#schema.match(value)

    if (error !== null)
      throw new EntityContractException(error, value)

    delete (value as Partial<Record>).VERSION
    value.UPDATED = Date.now()

    this.#state = value
  }

  public export (): object {
    return this.#state
  }
}
