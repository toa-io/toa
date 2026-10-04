import { Cron } from 'croner'

/**
 * The moments a schedule states, as a function of the clock: what comes first after a moment,
 * in milliseconds since the epoch. Nothing is kept between two questions, so every process that
 * holds the same expression answers the same.
 *
 * Raises where the expression or the zone does not parse, and where the expression names a
 * moment no calendar has — which is what reading a manifest refuses.
 */
export function occurrences(expression: string, zone: string): Occurrences {
  const fields = expression.trim().split(/\s+/).length

  // what the parser reads beyond these — a year, a nickname — is not what is documented
  if (fields !== 5 && fields !== 6)
    throw new Error(`'${expression}' is not a cron expression of five or six fields`)

  // given nothing to run, so it keeps no timer and is only ever asked
  const cron = new Cron(expression, { timezone: zone })

  function next(after: number): number | null {
    return cron.nextRun(new Date(after))?.getTime() ?? null
  }

  // the zone is not read until a moment is asked for
  if (next(Date.now()) === null) throw new Error(`'${expression}' never comes due`)

  return next
}

/** What comes first after `after`, or `null` where nothing ever does again. */
export type Occurrences = (after: number) => number | null
