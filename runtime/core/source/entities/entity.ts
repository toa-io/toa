import { environment } from '@toa.io/generic'
import { EntityContractException, EntityGuardException } from '../exceptions.js'
import { newid } from './newid.js'
import type { Schema } from '@toa.io/schemas'
import type { Guard } from '../guard.js'
import type { Record } from '../types/storages.js'
import type { Event } from '../types/state.js'

export class Entity {
  public deleted = false

  readonly #schema: Schema
  readonly #blank: object
  readonly #guards: Guard[] | undefined
  #origin: Record | null = null
  #state!: Record
  #mutable = true

  /**
   * A record makes an entity of what a storage holds; a string, or nothing at all, makes a
   * blank one under that identity, out of what the component declared a record starts as.
   *
   * @param blank what the component declares a record holds before anything is written to it
   * @param mutable whether the entity may be modified and committed
   */
  // eslint-disable-next-line max-params
  public constructor(
    schema: Schema,
    blank: object,
    argument?: Record | string,
    guards?: Guard[],
    mutable = true
  ) {
    this.#schema = schema
    this.#blank = blank
    this.#guards = guards

    if (typeof argument === 'object') this.#acquire(argument, mutable)
    else this.#write(this.#compose(argument ?? newid()))
  }

  public get(): Record {
    return this.#state
  }

  public set(value: Record): void {
    if (!this.#mutable)
      throw new Error('Entity acquired by a read-only operation cannot be modified')

    this.#guard(value)

    const error = this.#schema.fit(value)

    if (error !== null) throw new EntityContractException(error, value)

    this.#revive(value)
    this.#write(value)
  }

  public event(input?: object): Event {
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
  #acquire(record: Record, mutable: boolean): void {
    this.#mutable = mutable

    if (!mutable) {
      this.#write(record)

      return
    }

    this.#write(structuredClone(record))
    this.#origin = record
  }

  /**
   * A blank is not validated: what the component declared is fitted once, at boot, and the
   * system properties are the runtime's own. It is copied because every entity the component
   * makes is written over its own.
   */
  #compose(id: string): Record {
    // `REGION` here as well as in `#write`, because a record is validated before it is written
    // and what is composed is about to be written here: it is this region's
    return {
      id,
      VERSION: 0,
      DELETED: null,
      REGION,
      ...structuredClone(this.#blank)
    } as Record
  }

  #guard(value: Record): void {
    if (this.#guards === undefined) return

    for (const guard of this.#guards) {
      const ok = guard.fit(value, this.#origin)

      if (ok === false) throw new EntityGuardException(guard.name, value)
    }
  }

  // deletion is only expressed as a new DELETED timestamp,
  // so committing over a tombstone without touching it means revival
  #revive(value: Record): void {
    if (this.#origin?.DELETED == null || value.DELETED !== this.#origin.DELETED) return

    value.DELETED = null
    this.deleted = false
  }

  #write(value: Record): void {
    if (!('_trailers' in value))
      Object.defineProperty(value, '_trailers', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: {}
      })

    /*
     * The system properties are the runtime's to write, and a record does not always come from
     * a storage that wrote them: a component may bring its own, and one that answers with an
     * id and a version has left the rest to whoever asked. Filling them in here is what makes
     * a record's shape the runtime's guarantee rather than a storage's promise, and what lets
     * the entity require them.
     */
    value.CREATED ??= Date.now()
    value.UPDATED ??= value.CREATED
    value.VERSION ??= 0
    value.DELETED ??= null
    value.REGION ??= REGION

    if (value.DELETED !== null) this.deleted = true

    // beside the version and the timestamp, and for the same reason: all three say what the
    // write did, so all three change only where there is one. A record read here keeps the
    // region that wrote it, which is not necessarily this one — that is the whole of what it
    // is for, and stamping it on the way in would answer every read with the wrong region.
    if (this.#state !== undefined) {
      value.UPDATED = Date.now()
      value.VERSION++
      value.REGION = REGION
    }

    this.#state = value
  }
}

/**
 * The rank of the region this deployment is, from what deployed it. An application that is one
 * region has none and writes `0`, which is what the first region is and what a record written
 * before any of this existed is backfilled with.
 */
const REGION = Number(environment.get('TOA_REGION') ?? 0)
