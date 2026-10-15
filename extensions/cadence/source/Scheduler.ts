import { Connector, entities, exceptions } from '@toa.io/core'
import { occurrences } from '@toa.io/definitions/extensions.cadence'
import { recurring } from './row.ts'
import type { Local } from './Local.ts'
import type { Request } from '@toa.io/core/types'
import type { Recurrence } from '@toa.io/definitions/extensions.cadence'

/**
 * `context.schedule(endpoint, request, schedule)` — a call made at every occurrence of a calendar,
 * handed to the component that keeps delayed calls as one row it moves on as each occurrence is
 * disposed of.
 *
 * Like a delay it is not transactional with the caller's state. Unlike one, handing it over twice
 * is harmless: the id is what is scheduled, so the second is the first.
 */
export class Scheduler extends Connector {
  public readonly name = 'schedule'

  private readonly metronome: Local

  public constructor(metronome: Local) {
    super()

    this.metronome = metronome

    this.depends(metronome)
  }

  // named rather than forwarded, as the delay aspect's are
  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    switch (method) {
      case 'schedule':
        return await this.schedule(args[0], args[1], args[2])
      case 'cancel':
        return await this.cancel(args[0])
      default:
        throw new Error(`Schedule aspect has no '${method}' method`)
    }
  }

  /** Answers the id of the schedule, which is what cancels it. */
  private async schedule(
    endpoint: string,
    request: Record<string, unknown> | null | undefined,
    stated: string | Recurrence
  ): Promise<string> {
    const { schedule, zone, overdue, expires } = recurrence(stated)

    // a call that goes out as a task names no process, as a delayed call names none
    if (request !== null && request !== undefined && 'instance' in request)
      throw new exceptions.RequestContractException(
        'A scheduled call names no `instance`'
      )

    const input = request?.input

    // the occurrence is added to the input, so there has to be an object to add it to, and one
    // that does not already say what it would be overwriting
    if (input !== undefined && input !== null) {
      if (typeof input !== 'object' || Array.isArray(input))
        throw new exceptions.RequestContractException(
          'The input of a scheduled call is an object, to which its occurrence is added as `at`'
        )

      if ('at' in input)
        throw new exceptions.RequestContractException(
          'The input of a scheduled call states no `at`: that is the occurrence it is made for'
        )
    }

    let next

    try {
      next = occurrences(schedule, zone)
    } catch (error) {
      throw new exceptions.RequestContractException((error as Error).message)
    }

    const now = Date.now()
    const due = next(now)

    if (expires !== undefined && (due === null || due > expires))
      throw new exceptions.RequestContractException(
        `The schedule '${schedule}' expires before its first occurrence`
      )

    // a component that declares no namespace is named by its name, and called by its id
    if (endpoint.split('.').length === 2) endpoint = `default.${endpoint}`

    /*
     * What is scheduled is what the schedule is, so a second hand-over of it — a redelivery, a
     * retried transition — is the same row rather than a second call at every occurrence for good.
     */
    const id = entities.derive(
      'cadence',
      'schedule',
      endpoint,
      canonical(request ?? null),
      schedule,
      zone,
      expires ?? ''
    )

    const entity = {
      id,
      ...recurring({
        endpoint,
        due: due!,
        request: request ?? undefined,
        schedule,
        zone,
        overdue,
        expires
      })
    }

    /*
     * A schedule that was cancelled or had ended holds its id as a tombstone, and a fresh one
     * cannot be written beside it: that one is revived instead. Read first rather than told by
     * the write refusing, because a refusal is an operation that failed, and is logged as one.
     *
     * Raises from a chain that may only read, as `delay` does: storing it is a write.
     */
    const found = (await this.metronome.invoke('observe', {
      query: { id, deleted: true }
    } as Request)) as { DELETED?: number | null } | null

    if (found !== null && found.DELETED !== null && found.DELETED !== undefined)
      await this.resume(id, entity)
    else
      try {
        await this.metronome.invoke('ensure', { query: { id }, entity } as Request)
      } catch (error) {
        // cancelled between the read and the write
        if ((error as { code?: unknown })?.code === DUPLICATE)
          await this.resume(id, entity)
        else throw error
      }

    return id
  }

  /** Revives the tombstone of a schedule handed over again, waiting for its first occurrence. */
  private async resume(id: string, entity: { due: number; lane: number }): Promise<void> {
    await this.metronome.invoke('resume', {
      query: { id, deleted: true },
      input: { due: entity.due, lane: entity.lane }
    } as Request)
  }

  /** Tombstones the row, as cancelling a delay does. */
  private async cancel(id: string): Promise<unknown> {
    return await this.metronome.invoke('terminate', { query: { id }, input: null })
  }
}

function recurrence(
  stated: string | Recurrence
): Required<Pick<Recurrence, 'schedule' | 'zone'>> & Recurrence {
  const declared = typeof stated === 'string' ? { schedule: stated } : stated

  if (
    declared === null ||
    typeof declared !== 'object' ||
    typeof declared.schedule !== 'string'
  )
    throw new exceptions.RequestContractException(
      'A schedule is a cron expression, or an object stating one as `schedule`'
    )

  const { schedule, zone = 'UTC', overdue, expires } = declared

  if (typeof zone !== 'string')
    throw new exceptions.RequestContractException(
      'A schedule names its `zone` by a string'
    )

  if (overdue !== undefined && !(Number.isInteger(overdue) && overdue >= 0))
    throw new exceptions.RequestContractException(
      'The `overdue` of a schedule is a whole number of milliseconds'
    )

  if (expires !== undefined && !Number.isInteger(expires))
    throw new exceptions.RequestContractException(
      'The `expires` of a schedule is milliseconds since the epoch'
    )

  return { schedule, zone, overdue, expires }
}

/** what storing a row under an id a tombstone already holds raises */
const DUPLICATE = exceptions.codes.Duplicate

/**
 * JSON with the keys of every object in order, so that two requests that say the same thing are
 * one schedule however their keys were written.
 */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        )
      : value
  )
}
