import type { Readable } from 'node:stream'
import type { Connector } from '../connector.js'
import type { Locator } from '../locator.js'
import type { Call, Inbox } from './inbox.js'
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

/** What a storage stores. `id` is the key; the upper-cased names are core's. */
export interface Record {
  id: string
  VERSION: number
  CREATED?: number
  UPDATED?: number
  /** a tombstone's timestamp; `null` on a live record */
  DELETED?: number | null

  /** the rank of the region that last wrote it; `0` where there is one region */
  REGION?: number
  [key: string]: any
}

/** Everything a request query carried that was not a selector. */
export interface Options {
  omit?: number
  limit?: number
  /** normalised by `query/options.ts` from `'name:asc'` into pairs */
  sort?: Array<[property: string, direction: string]>
  /** always includes `VERSION`, `CREATED`, `UPDATED`, `DELETED` */
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
  get(query: Query): Promise<Record | null>

  /** scope `objects` */
  find(query: Query): Promise<Record[]>

  /** scope `stream` */
  stream(query?: Query): Promise<Readable>

  /**
   * A transition's commit. `false` is a lost compare-and-swap, not an error. Where `row` is
   * given, it is committed in the same transaction as the record or not at all, and where
   * `call` is, so is that — and an identity already recorded raises `DuplicateCall` instead,
   * having written nothing.
   */
  store(record: Record, row?: Row, call?: Call): Promise<boolean>

  /** a transition over `objects` */
  massStore(records: Record[], rows?: Row[]): Promise<boolean>

  /** an assignment; `null` where the query matched nothing */
  upsert(query: Query, changeset: object, row?: Row, call?: Call): Promise<Record | null>

  /** get-or-create, in one indivisible step */
  // eslint-disable-next-line max-params
  ensure(
    query: Query | undefined,
    properties: object,
    record: Record,
    row?: Row,
    call?: Call
  ): Promise<Record>

  /** the driver's own handle, which an unmanaged operation is given as its state */
  readonly raw: unknown

  /**
   * Present only where a row can be committed atomically with the entity. Its absence is
   * what makes the runtime publish inline, so a storage that cannot do this must not offer
   * it: a row written outside the transaction would be a second write with a crash window
   * in front of it, which is the defect the outbox exists to close.
   */
  readonly outbox?: Outbox

  /**
   * Present only where a call can be recorded atomically with the entity, and only where a
   * component declares `once`. Unlike the outbox there is no weaker thing to fall back to —
   * a record written outside the transaction guarantees nothing — so a storage that cannot
   * says so through `claims`, and a component that asked for it does not boot.
   */
  readonly inbox?: Inbox

  /**
   * Whether this storage can record a call at all, which is a property of the storage rather
   * than of the deployment it is pointed at, and so is answerable before it is connected.
   */
  readonly claims?: boolean

  /**
   * Whether this storage applies `entity.migrations`. Absent is what a storage that does not
   * says, and a component declaring migrations against one is refused at boot rather than
   * starting with a structure nothing has made.
   */
  readonly migrates?: boolean

  /**
   * Writes `record` as it stands — its `VERSION`, its timestamps, its `REGION` and whatever
   * else it carries — where what it would replace precedes it: a lower `VERSION`, or the same
   * `VERSION` written by a region this one outranks. `false` where it does not: nothing is
   * written, and that is not an error.
   *
   * Both sides of the comparison are on the two records, so this takes nothing else. What it
   * is for is a record that was written somewhere else and has to land here as it was, which
   * is neither a transition nor an assignment: it is not the writer's version to increment,
   * nor its timestamps to set.
   */
  converge?(record: Record): Promise<boolean>

  /**
   * Whether this storage converges. Absent is what a storage that does not says, and a
   * component of a context that converges stands down rather than running where it would
   * never take a record from another region.
   */
  readonly converges?: boolean
}

/**
 * The subset of a component's entity declaration a storage reads. Structural, so that core
 * names no type of `@toa.io/norm`, which depends on core.
 */
export interface Entity {
  associated?: boolean
  custom?: boolean
  /** in the order they are applied; what a step is belongs to the storage that reads it */
  migrations?: Migration[]
}

/**
 * One file of a `migrations` directory, named after it — the component's own, or a prototype's,
 * which every descendant applies to its collection ahead of its own.
 */
export interface Migration {
  id: string
  steps: unknown[]
  /** the prototype it is inherited from; absent on the component's own */
  prototype?: string
}

export interface StorageOptions {
  /** whether the component publishes anything, and so needs a place to commit a row */
  outbox?: boolean
}

export interface Factory {
  storage(locator: Locator, entity: Entity, options?: StorageOptions): Storage
}
