import * as schemas from './schemas.ts'
import { occurrences } from './schedule.ts'
import type { Declaration, Declared, Entry, Pulse, Schedule, Stated } from './types.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * The `cadence:` block of a component manifest: the operations called on a cadence or at the
 * moments of a calendar, by the operation each entry calls. Norm hands over the whole manifest,
 * so what the declaration refers to is checked here rather than left to fail at boot.
 *
 * A component that declares nothing still has a declaration. `cadence: ~` is how one that only
 * delays calls says so, and it has to produce a value or norm rejects the extension.
 */
export function manifest(
  declaration: Declared | null | undefined,
  component: Manifest
): Declaration {
  const normalized = expand(declaration)

  schemas.declaration.validate<Declaration>(normalized, 'Invalid cadence declaration')

  for (const [endpoint, entries] of Object.entries(normalized)) {
    const operation = component.operations?.[endpoint]

    if (operation === undefined)
      throw new Error(`Cadence refers to undefined operation '${endpoint}'`)

    if (!TYPES.has(operation.type))
      throw new Error(
        `Cadence of '${endpoint}' must refer to an operation of the allowed types: ` +
          [...TYPES].join(', ')
      )

    for (const entry of entries) check(endpoint, entry)
  }

  return normalized
}

/**
 * An entry is one kind or the other, and each kind is a closed shape: what belongs to a pulse
 * is refused beside a schedule and the other way round, by the schema of the kind it is.
 */
function check(endpoint: string, entry: Entry): void {
  const pulse = 'cycle' in entry
  const schedule = 'schedule' in entry

  if (pulse && schedule)
    throw new Error(`Cadence of '${endpoint}' states both a cycle and a schedule`)

  if (schedule) return scheduled(endpoint, entry)
  if (pulse) return pulsed(endpoint, entry)

  throw new Error(`Cadence of '${endpoint}' states neither a cycle nor a schedule`)
}

function pulsed(endpoint: string, pulse: Pulse): void {
  schemas.pulse.validate<Pulse>(pulse, `Invalid pulse '${endpoint}'`)

  if (pulse.intervals > pulse.cycle)
    throw new Error(
      `Pulse '${endpoint}' splits a cycle of ${pulse.cycle} seconds into ` +
        `${pulse.intervals} intervals, which is less than a second each`
    )

  // what lives in a process is that process's own in every region
  if (pulse.scope === 'replica' && pulse.region !== undefined)
    throw new Error(`Pulse '${endpoint}' is every replica's and cannot name a region`)
}

function scheduled(endpoint: string, schedule: Schedule): void {
  // read before the schema, which takes a null for the number it coerces it to: no bound at all
  // is what a delay may state and a schedule may not, because nothing would then keep the
  // occurrences of an outage from all being owed at once
  if ((schedule as { overdue?: unknown }).overdue === null)
    throw new Error(
      `Invalid schedule '${endpoint}': a schedule states a bound or none, not null`
    )

  schemas.schedule.validate<Schedule>(schedule, `Invalid schedule '${endpoint}'`)

  try {
    occurrences(schedule.schedule, schedule.zone)
  } catch (error) {
    throw new Error(`Invalid schedule '${endpoint}': ${(error as Error).message}`, {
      cause: error
    })
  }
}

/** An operation has a list of entries, and an entry states everything its kind has. */
function expand(declaration: Declared | null | undefined): Declaration {
  if (declaration === null || declaration === undefined) return {}

  return Object.fromEntries(
    Object.entries(declaration).map(([endpoint, stated]) => [
      endpoint,
      (Array.isArray(stated) ? stated : [stated]).map(entry)
    ])
  )
}

function entry(stated: Stated): Entry {
  // a number is a cycle nothing splits and a string is an expression, which is what the
  // shorthands declare
  const declared: Record<string, unknown> =
    typeof stated === 'number'
      ? { cycle: stated }
      : typeof stated === 'string'
        ? { schedule: stated }
        : { ...stated }

  if ('schedule' in declared) declared.zone ??= 'UTC'
  else if ('cycle' in declared) {
    declared.intervals ??= 1

    // a pulse that does not say whose work it is is the component's, as every pulse was
    declared.scope ??= 'group'
  }

  return declared as unknown as Entry
}

/**
 * The types a receiver may refer to. An operation that produces no side effects has nothing to
 * be called periodically for.
 */
const TYPES = new Set(['transition', 'assignment', 'effect', 'unmanaged'])
