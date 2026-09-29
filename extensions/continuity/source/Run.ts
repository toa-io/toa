import { AsyncLocalStorage } from 'node:async_hooks'
import { entities, trail } from '@toa.io/core'
import { decode, encode } from './answers.ts'
import { fingerprint } from './fingerprint.ts'
import type { Kept } from './answers.ts'
import type { Journal } from './Journal.ts'

/**
 * One attempt of a run: a task or an event, known by the identity it carries on every attempt.
 *
 * Put in scope where the component is invoked, and read where the context is asked. The context
 * of an operation is one object shared by every invocation of it, so nothing per invocation can
 * be handed to it — as the trail is not, for the same reason.
 */
export class Run {
  public readonly id: string

  private readonly journal: Journal
  private readonly window: number
  private readonly steps: Map<string, Kept>
  private expires: number | undefined

  /** how many times this attempt has asked each thing, by what it asked */
  private readonly asked = new Map<string, number>()

  /** what was taken without waiting and is still being written */
  private readonly writing = new Set<Promise<Kept>>()

  // eslint-disable-next-line max-params
  private constructor(id: string, journal: Journal, window: number, recalled: Recalled) {
    this.id = id
    this.journal = journal
    this.window = window
    this.steps = recalled.steps
    this.expires = recalled.expires
  }

  /** an attempt, with what the run kept before it */
  public static async begin(id: string, journal: Journal, window: number): Promise<Run> {
    return new Run(id, journal, window, await journal.recall(id))
  }

  /**
   * The run the invocation running now is, where it is one. Only the invocation the run was
   * handed to: a call it makes to its own component runs in the same scope, and under an identity
   * of its own.
   */
  public static current(): Run | undefined {
    const run = storage.getStore()

    if (run === undefined || trail.current()?.id !== run.id) return undefined

    return run
  }

  /** runs `attempt` as this run */
  public async within<T>(attempt: () => Promise<T>): Promise<T> {
    return await storage.run(this, attempt)
  }

  /**
   * A step that answers later: what was kept is given back, and what was not is made — under the
   * identity the step's key is — kept, and what is kept is given back. So the operation is given
   * what a later attempt will be given, including where a copy of the run kept it first.
   */
  public async step(
    member: string,
    args: unknown[],
    make: (id: string) => Promise<unknown>
  ): Promise<unknown> {
    const key = this.key(member, args)
    const kept = this.steps.get(key)

    if (kept !== undefined) return decode(kept)

    // a value taken without waiting may be what this step is asked with, so it is kept first
    await this.settle()

    const answer = await make(key)
    const stored = await this.journal.record(
      this.id,
      key,
      await encode(answer),
      this.expiry()
    )

    this.steps.set(key, stored)

    return decode(stored)
  }

  /**
   * A step that answers at once — a new id, the time, a random number. What was kept is given
   * back; what was not is taken, given, and written without waiting, and anything the attempt makes
   * after it waits for the write.
   */
  public value<T>(member: string, take: () => T): T {
    const key = this.key(member, [])
    const kept = this.steps.get(key)

    if (kept !== undefined) return decode(kept) as T

    const value = take()
    const encoded: Kept = { value }

    this.steps.set(key, encoded)

    const write = this.journal.record(this.id, key, encoded, this.expiry())

    this.writing.add(write)
    void write.then(
      () => this.writing.delete(write),
      () => undefined
    )

    return value
  }

  /** waits for what is being written, and raises where a write failed */
  public async settle(): Promise<void> {
    if (this.writing.size > 0) await Promise.all(this.writing)
  }

  /**
   * The member, a digest of what it was asked, and how many times this attempt has asked exactly
   * that before: the order steps are made in is not the same on every attempt, and what they ask
   * is.
   */
  private key(member: string, args: unknown[]): string {
    const asked = member + ':' + fingerprint(args)
    const count = this.asked.get(asked) ?? 0

    this.asked.set(asked, count + 1)

    return entities.derive(this.id, asked, count)
  }

  /** fixed by the run's first step, so that a run is kept whole and reaped whole */
  private expiry(): number {
    this.expires ??= Date.now() + this.window * 1000

    return this.expires
  }
}

interface Recalled {
  steps: Map<string, Kept>
  expires: number | undefined
}

// as the trail holds its own: a process may carry two copies of this module
const KEY = Symbol.for('toa.continuity.run')

type Store = typeof globalThis & { [KEY]?: AsyncLocalStorage<Run> }

const storage = ((globalThis as Store)[KEY] ??= new AsyncLocalStorage<Run>())
