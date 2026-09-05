import { EntityContractException, EntityGuardException } from '../exceptions.js'
import { newid } from './newid.js'
import type { Schema } from '@toa.io/schemas'
import type { Guard } from '../guard.js'
import type { Record } from '../types/storages.js'
import type { Event } from '../types/state.js'

export class Entity {
  public deleted = false

  readonly #schema: Schema
  readonly #guards: Guard[] | undefined
  #origin: Record | null = null
  #state!: Record
  #mutable = true

  /**
   * A record makes an entity of what a storage holds; a string, or nothing at all, makes a
   * blank one under that identity.
   *
   * @param mutable whether the entity may be modified and committed
   */
  // eslint-disable-next-line max-params
  public constructor (schema: Schema, argument?: Record | string, guards?: Guard[],
    mutable = true) {
    this.#schema = schema
    this.#guards = guards

    if (typeof argument === 'object')
      this.#acquire(argument, mutable)
    else
      this.#blank(argument ?? newid())
  }

  public get (): Record {
    return this.#state
  }

  public set (value: Record, optional = false): void {
    if (!this.#mutable)
      throw new Error('Entity acquired by a read-only operation cannot be modified')

    if (!optional)
      this.#guard(value)

    const error = optional ? this.#schema.fitOptional(value) : this.#schema.fit(value)

    if (error !== null)
      throw new EntityContractException(error, value)

    this.#revive(value)
    this.#write(value)
  }

  public event (input?: object): Event {
    return {
      origin: this.#origin,
      state: this.#state,
      trailers: this.#state._trailers,
      input
    }
  }

  /**
   * The origin is the pre-image a commit diffs the new state against. An operation that
   * cannot commit has nothing to diff, so it takes the record as it came from the storage
   * instead of paying for a deep copy of every record it read.
   */
  #acquire (record: Record, mutable: boolean): void {
    this.#mutable = mutable

    if (!mutable) {
      this.#write(record)

      return
    }

    this.#write(structuredClone(record))
    this.#origin = record
  }

  #blank (id: string): void {
    this.set({ id, VERSION: 0 }, OPTIONAL)
  }

  #guard (value: Record): void {
    if (this.#guards === undefined)
      return

    for (const guard of this.#guards) {
      const ok = guard.fit(value, this.#origin)

      if (ok === false)
        throw new EntityGuardException(guard.name, value)
    }
  }

  // deletion is only expressed as a new DELETED timestamp,
  // so committing over a tombstone without touching it means revival
  #revive (value: Record): void {
    if (this.#origin?.DELETED == null || value.DELETED !== this.#origin.DELETED)
      return

    value.DELETED = null
    this.deleted = false
  }

  #write (value: Record): void {
    if (!('_trailers' in value))
      Object.defineProperty(value, '_trailers', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: {}
      })

    if (!('CREATED' in value)) {
      value.CREATED = Date.now()
      value.UPDATED ??= value.CREATED
    }

    if ('DELETED' in value && value.DELETED !== null)
      this.deleted = true

    if (this.#state !== undefined) {
      value.UPDATED = Date.now()
      value.VERSION++
    }

    this.#state = value
  }
}

/** a blank is written before it is complete, so it is fitted against the optional schema */
const OPTIONAL = true
