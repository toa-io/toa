import { console } from 'openspan'
import { Connector, Locator } from '@toa.io/core'
import {
  BATCH,
  DISCRETENESS,
  LANES,
  number
} from '@toa.io/definitions/extensions.cadence'
import type { Local } from './Local.js'
import type { atomicity } from '@toa.io/core/types'

/**
 * Makes the calls that were put off.
 *
 * Two tiers, which is what a store polled rarely and a call due to the second need between
 * them: the rows are the record, and one scan primes the next two intervals of them into
 * timers. A crash loses the timers and nothing else — the next scan reads what is overdue
 * along with what is upcoming, so a dispatcher that died mid-interval costs a delay and not a
 * call.
 *
 * Partitioned by lane exactly as the outbox is, so every replica scans and dispatches its own
 * share of every interval rather than taking turns at whole ones.
 */
export class Dispatcher extends Connector {
  private readonly metronome: Local
  private readonly resolve: (locator: Locator) => Local
  private readonly atom: atomicity.Atom

  /** rows in this replica's hands — a timer set for them, or a call of theirs on its way */
  private readonly armed = new Map<string, Armed>()

  /** ids called and not yet removed, held until a scan settles them */
  private called = new Set<string>()

  /** what it has called through, so that each is torn down with it */
  private readonly targets = new Set<Local>()

  /** milliseconds between passes, and how far ahead each one reaches */
  private readonly discreteness: number

  private timer?: NodeJS.Timeout
  private off?: () => void
  private scanning = false
  private closing = false

  /** when the scan that is running started, so a tick that finds it can say how long */
  private started = 0

  public constructor(
    metronome: Local,
    resolve: (locator: Locator) => Local,
    atom: atomicity.Atom
  ) {
    super()

    this.metronome = metronome
    this.resolve = resolve
    this.atom = atom
    this.discreteness = number('TOA_CADENCE_DISCRETENESS', DISCRETENESS * 1000)

    this.depends(metronome)
    this.depends(atom)
  }

  protected override async open(): Promise<void> {
    this.timer = setInterval(() => {
      this.tick()
    }, this.discreteness)
    this.timer.unref()

    // a lane changing hands is when its rows become this replica's, or stop being
    this.off = this.atom.onassigned(() => {
      this.adopt()
    })
  }

  protected override async close(): Promise<void> {
    this.closing = true

    this.off?.()
    clearInterval(this.timer)

    for (const { timer } of this.armed.values()) clearTimeout(timer)

    this.armed.clear()

    await this.settle()
  }

  /** One scan at a time: a slow one must not have another started underneath it. */
  private tick(): void {
    if (this.closing) return

    /*
     * Skipped, and said so. The guard itself is right — a second scan on top of one that has
     * not returned only makes it worse — but a pass that outlives its interval takes every
     * pass after it with it, and nothing is dispatched at all while that lasts. Silently, it
     * is a dispatcher that stops dispatching in a deployment that ran for months.
     */
    if (this.scanning) {
      const running = Date.now() - this.started
      const details = { running, discreteness: this.discreteness }
      const message = 'Delayed calls scan has not returned, so this pass is skipped'

      // past a few intervals it is not a slow pass but a stuck one
      if (running > STALLED * this.discreteness) console.error(message, details)
      else console.warn(message, details)

      return
    }

    this.scanning = true
    this.started = Date.now()

    void this.scan()
      .catch((error: unknown) => {
        console.error('Delayed calls scan failed', { error })
      })
      .finally(() => {
        this.scanning = false
      })
  }

  /**
   * What this replica owns has changed. Timers for lanes it no longer holds are dropped —
   * whoever holds them now will arm them — and a scan runs at once rather than at the next
   * interval, so lanes just acquired are not left waiting.
   */
  private adopt(): void {
    // nothing owned is nothing held: what was armed under a claim this replica no longer has
    // belongs to whoever has it now, and firing it anyway is the call twice
    this.disarm(this.atom.slots(LANES) ?? [])

    this.tick()
  }

  /** What is armed for a lane this replica no longer holds: whoever holds it now will arm it. */
  private disarm(lanes: number[]): void {
    for (const [id, { timer, lane }] of this.armed) {
      if (lanes.includes(lane)) continue

      clearTimeout(timer)
      this.armed.delete(id)
    }
  }

  private async scan(): Promise<void> {
    // ahead of the claim, because settling needs none: the rows are ones this replica has
    // already called, and one left live is one the next owner of its lane calls again
    await this.settle()

    const lanes = this.atom.slots(LANES)

    if (lanes === null || lanes.length === 0) return

    const now = Date.now()

    /*
     * Two intervals, so that consecutive passes overlap by one whole one. Reaching exactly as
     * far as the next pass leaves a sliver beyond the horizon that the next pass reads already
     * overdue — the width of the drift between the two, which a row with a tight `overdue`
     * does not survive. The overlap absorbs that, a settle that ran long, a tick skipped
     * outright, and the clock skew between the replica that wrote `due` and this one.
     *
     * Reaching further costs nothing a cancellation would pay for, because what is armed is
     * given up again the moment a scan stops reading it — see `forget`.
     */
    const until = now + 2 * this.discreteness

    const rows = (await this.metronome.invoke('enumerate', {
      query: {
        // expiry is not a criterion: a row nobody reads is a row nobody settles, and it would
        // stay live for good. It is read, and settled without the call being made
        criteria: `lane=in=(${lanes.join(',')});due<${until}`,
        sort: ['due:asc'],
        limit: BATCH
      }
    })) as Row[]

    // the horizon is truncated to the last row of a full batch, and everything past it arrives
    // on a later pass already overdue. Where this is logged, the batch is too small for the rate
    const truncated = rows.length === BATCH

    if (truncated)
      console.warn('Delayed calls scan filled its batch', {
        limit: BATCH,
        lanes: lanes.length
      })

    for (const row of rows) this.arm(row)

    if (!truncated) this.forget(new Set(rows.map((row) => row.id)))
  }

  /**
   * Gives up what the store no longer answers with. A scan reads everything still owed in the
   * lanes this replica holds, so a row it armed before and does not read now is one nothing
   * owes any more — cancelled, most of the time — and a timer left for it makes the call
   * regardless.
   *
   * This is what lets a scan reach further ahead than the next one without a cancellation
   * becoming any less reliable: a row is held only for as long as the store keeps saying it is
   * owed, so what bounds cancelling is the period between passes and not how far one reaches.
   *
   * Two things are not evidence of a cancellation. A batch filled to its limit is a read that
   * was cut short, and says nothing about what it did not reach. And a call already on its way
   * is settled by its own path rather than by what a scan reads.
   */
  private forget(read: Set<string>): void {
    for (const [id, { timer }] of this.armed) {
      if (read.has(id) || this.called.has(id)) continue

      clearTimeout(timer)
      this.armed.delete(id)
    }
  }

  /**
   * A row already armed is left alone: a scan reads what it read before, because a row stays
   * until its call has been made.
   */
  private arm(row: Row): void {
    if (this.armed.has(row.id) || this.called.has(row.id)) return

    const now = Date.now()

    /*
     * Past the bound its caller gave it, so the call is not made — and the row is settled all
     * the same, silently, because an expired call is not an event anything sees. Left unread
     * it would never be settled either: a row nothing will ever act on, sitting in the
     * collection and in front of every scan, for good.
     */
    if (row.expires <= now) {
      this.called.add(row.id)

      return
    }

    const timer = setTimeout(
      () => {
        void this.dispatch(row)
      },
      Math.max(row.due - now, 0)
    )

    timer.unref()
    this.armed.set(row.id, { timer, lane: row.lane })
  }

  /**
   * The call goes out before the row is removed, never the other way round: a crash in between
   * makes the call twice, and the other order would lose it. It travels as a task, so the
   * broker holds it if the target is not there to take it.
   */
  private async dispatch(row: Row): Promise<void> {
    if (this.closing) {
      this.armed.delete(row.id)

      return
    }

    const [namespace, name, endpoint] = row.endpoint.split('.')
    const local = this.target(new Locator(name, namespace))

    /*
     * Attempted before it is made, not after it comes back. One attempt is what a dispatcher
     * has to give: what it can tell about a failure is nothing, and a request the target's
     * schema no longer fits never becomes one it does.
     */
    this.called.add(row.id)

    /*
     * The call travels as a task, so what raises here is this side of it: a stored request the
     * target's contract no longer fits, an endpoint it no longer has, a broker that refused the
     * enqueue. What the operation itself does with it happens in the target's own process and
     * never comes back.
     *
     * Skipped, as a pulse skips: reported, and the row settled on the attempt either way.
     */
    await local
      .invoke(endpoint, { input: null, ...row.request, task: true })
      .catch((error: unknown) => {
        console.error('Delayed call failed', {
          endpoint: row.endpoint,
          id: row.id,
          error
        })
      })
      // held for as long as the call is, so `armed` answers what this replica has in hand
      // rather than what it has a timer for
      .finally(() => {
        this.armed.delete(row.id)
      })
  }

  /**
   * A remote is resolved once per target and held: it opens a connection, and one nothing
   * depends on would outlive the dispatcher that made it.
   */
  private target(locator: Locator): Local {
    const local = this.resolve(locator)

    if (!this.targets.has(local)) {
      this.targets.add(local)
      this.depends(local)
    }

    return local
  }

  /** One write for many rows, which is why the ids are held rather than settled one by one. */
  private async settle(): Promise<void> {
    if (this.called.size === 0) return

    const ids = [...this.called]

    await this.metronome.invoke('settle', { query: { ids }, input: null })

    // held until the write comes back, so that one which does not leaves them to a later scan
    for (const id of ids) this.called.delete(id)
  }
}

interface Armed {
  timer: NodeJS.Timeout
  lane: number
}

interface Row {
  id: string
  lane: number
  due: number

  /** past this the call is not made; the row is settled without it */
  expires: number

  endpoint: string
  request?: object
}

/** intervals a scan may run for before it is a stuck pass rather than a slow one */
const STALLED = 5
