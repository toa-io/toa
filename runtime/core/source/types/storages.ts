import type { Readable } from 'node:stream'
import type { Connector } from '../connector.js'
import type { Locator } from '../locator.js'
import type { Row, Storage as Outbox } from './outbox.js'

/** the RSQL tree `@rsql/parser` produces; a storage translates it into its own dialect */
export interface Node {
  type: 'LOGIC' | 'COMPARISON' | 'SELECTOR' | 'VALUE'
  left?: Node
  right?: Node
  operator?: string
  selector?: string
  value?: unknown
}

/** What a storage stores. `id` is the key; everything prefixed `_` is core's. */
export interface Record {
  id: string
  _version: number
  _created?: number
  _updated?: number
  /** a tombstone's timestamp; `null` on a live record */
  _deleted?: number | null
  [key: string]: any
}

/** Everything a request query carried that was not a selector. */
export interface Options {
  omit?: number
  limit?: number
  /** normalised by `query/options.ts` from `'name:asc'` into pairs */
  sort?: Array<[property: string, direction: string]>
  /** always includes `_version`, `_created`, `_updated`, `_deleted` */
  projection?: string[]
  sample?: number
  /** include tombstones; without it an observation answers `null` over one */
  deleted?: boolean
}

/** What core hands a storage, written by `Query.parse`. */
export interface Query {
  id?: string
  /** many identities at once; `State.objects` inits whichever of them are missing */
  ids?: string[]
  version?: number
  criteria?: Node
  search?: string
  options?: Options
}

/**
 * What core requires of a storage. Every member but `outbox` is called unguarded, so a
 * storage that leaves one out throws where an operation needs it — a storage may serve
 * only some scopes, and says so by failing rather than by declaring less.
 */
export interface Storage extends Connector {
  /** scope `object` */
  get (query: Query): Promise<Record | null>

  /** scope `objects` */
  find (query: Query): Promise<Record[]>

  /** scope `stream` */
  stream (query?: Query): Promise<Readable>

  /**
   * A transition's commit. `false` is a lost compare-and-swap, not an error. Where `row` is
   * given, it is committed in the same transaction as the record or not at all.
   */
  store (record: Record, row?: Row): Promise<boolean>

  /** a transition over `objects` */
  massStore (records: Record[], rows?: Row[]): Promise<boolean>

  /** an assignment; `null` where the query matched nothing */
  upsert (query: Query, changeset: object, row?: Row): Promise<Record | null>

  /** get-or-create, in one indivisible step */
  ensure (query: Query | undefined, properties: object, record: Record, row?: Row):
  Promise<Record>

  /** the driver's own handle, which an unmanaged operation is given as its state */
  readonly raw: unknown

  /**
   * Present only where a row can be committed atomically with the entity. Its absence is
   * what makes the runtime publish inline, so a storage that cannot do this must not offer
   * it: a row written outside the transaction would be a second write with a crash window
   * in front of it, which is the defect the outbox exists to close.
   */
  readonly outbox?: Outbox
}

/**
 * The subset of a component's entity declaration a storage reads. Structural, so that core
 * names no type of `@toa.io/norm`, which depends on core.
 */
export interface Entity {
  schema: object
  associated?: boolean
  custom?: boolean
  unique?: { [name: string]: string[] }
  index?: { [name: string]: { [property: string]: string } }
}

export interface StorageOptions {
  /** whether the component publishes anything, and so needs a place to commit a row */
  outbox?: boolean
}

export interface Factory {
  storage (locator: Locator, entity: Entity, options?: StorageOptions): Storage
}
