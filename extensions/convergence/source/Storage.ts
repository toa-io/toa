import { console, decode, run, type SpanOptions } from 'openspan'
import { environment } from '@toa.io/generic'
import { Connector } from '@toa.io/core'
import { CHANNEL } from '@toa.io/definitions/extensions.convergence'
import type { Readable } from 'node:stream'
import type { Connector as Link, Locator } from '@toa.io/core'
import type { bindings, outbox, storages } from '@toa.io/core/types'
import type { Message } from './Destination.ts'

/**
 * A record from another region is written as it stands: its version, its timestamps, its
 * region. That is neither a transition nor an assignment — it is not this region's version to
 * increment nor its timestamps to set — so it goes to the storage rather than through an
 * operation, and this is what holds one.
 *
 * Everything else it delegates. It decorates the storage because that is where a handle to one
 * is, not because it changes anything a component reads or writes.
 */
export class Converging extends Connector implements storages.Storage, bindings.Inbound {
  private readonly storage: storages.Storage
  private readonly locator: Locator
  private readonly subscribe: (sink: bindings.Inbound) => Promise<Link>
  private readonly delivery: SpanOptions
  private readonly processing: SpanOptions

  public constructor(
    storage: storages.Storage,
    locator: Locator,
    connect: (sink: bindings.Inbound) => Promise<Link>
  ) {
    super()

    this.storage = storage
    this.locator = locator
    this.subscribe = connect

    // what it decorates opens before it and closes after it, so the storage is whole while a
    // delivery is still draining
    this.depends(storage)

    this.delivery = {
      name: `${CHANNEL} deliver`,
      kind: 'producer',
      service: CHANNEL,
      attributes: { 'messaging.destination.name': CHANNEL }
    }

    this.processing = {
      name: `${CHANNEL} process`,
      kind: 'consumer',
      service: locator.id,
      attributes: { 'messaging.destination.name': CHANNEL }
    }
  }

  /**
   * There is no counter to increment here, so the outcome is on the span: without it,
   * convergence dropping a duplicate and convergence dropping everything look exactly alike.
   */
  public async accept(message: object): Promise<void> {
    const { record, trace } = message as Message

    /*
     * A record carrying this region's own rank cannot have come from anywhere: a region is
     * not bound to what it publishes, and it republishes nothing it converges, so the rank on a
     * record that arrives is the rank of the region that wrote it. Two of them sharing one is
     * a misconfiguration nothing else can see — no deployment knows what the others declared —
     * and it means ties between those two resolve for neither.
     */
    if ((record as storages.Record).REGION === REGION)
      console.error('Convergence received a record of this region\'s own rank', {
        component: this.locator.id,
        region: REGION
      })

    const remote = trace === undefined ? null : decode(trace)

    const task = async (): Promise<void> =>
      console.span(this.delivery, async () =>
        console.span(this.processing, async () => {
          const applied = await this.storage.converge!(record as storages.Record)

          console.trace('Convergence processed', {
            component: this.locator.id,
            outcome: applied ? 'applied' : 'stale'
          })
        })
      )

    if (remote === null) await task()
    else await run(remote, task)
  }

  protected override async open(): Promise<void> {
    /*
     * Without a durable outbox a publication is lost where the process dies before it lands,
     * and a lost one here is two regions differing for good, with nothing that notices and
     * nothing that repairs it. That is why this refuses where events only degrade.
     */
    if (this.storage.outbox === undefined)
      throw new Error(
        `Component '${this.locator.id}' converges, and its storage offers no outbox.`
      )

    const inbound = await this.subscribe(this)

    await inbound.connect()

    this.depends(inbound)
  }

  // region delegated

  public get raw(): unknown {
    return this.storage.raw
  }

  public get outbox(): storages.Storage['outbox'] {
    return this.storage.outbox
  }

  public get migrates(): boolean | undefined {
    return this.storage.migrates
  }

  public get converges(): boolean | undefined {
    return this.storage.converges
  }

  public async get(query: storages.Query): Promise<storages.Record | null> {
    return this.storage.get(query)
  }

  public async find(query: storages.Query): Promise<storages.Record[]> {
    return this.storage.find(query)
  }

  public async stream(query?: storages.Query): Promise<Readable> {
    return this.storage.stream(query)
  }

  public async store(record: storages.Record, row?: outbox.Row): Promise<boolean> {
    return this.storage.store(record, row)
  }

  public async massStore(records: storages.Record[], rows?: outbox.Row[]): Promise<boolean> {
    return this.storage.massStore(records, rows)
  }

  public async upsert(
    query: storages.Query,
    changeset: object,
    row?: outbox.Row
  ): Promise<storages.Record | null> {
    return this.storage.upsert(query, changeset, row)
  }

  // eslint-disable-next-line max-params
  public async ensure(
    query: storages.Query | undefined,
    properties: object,
    record: storages.Record,
    row?: outbox.Row
  ): Promise<storages.Record> {
    return this.storage.ensure(query, properties, record, row)
  }

  public async converge(record: storages.Record): Promise<boolean> {
    return this.storage.converge!(record)
  }

  // endregion
}

/** The rank of this region, which nothing that arrives should be carrying. */
const REGION = Number(environment.get('TOA_REGION') ?? 0)
