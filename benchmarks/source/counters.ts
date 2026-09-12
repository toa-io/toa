/** Counters that grow with the work done: messages published and database operations. */
export interface Counts {
  publish: number
  operations: number
}

export interface Window {
  before: Counts
  after: Counts
  seconds: number
  requests: number
  /** the rate of each counter while no load is sent, per second */
  background: Counts
}

/**
 * User and system time of a process, all its threads included, in seconds, from the line of
 * `/proc/<pid>/stat`. The command in parentheses may contain anything, so fields are counted
 * from the last parenthesis: `utime` and `stat` are the 14th and 15th.
 */
export function cpu(stat: string, ticks: number): number {
  const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ')

  return (Number(fields[11]) + Number(fields[12])) / ticks
}

/** What the `top` command counts for the collections of one database. */
export function operations(totals: Record<string, unknown>, database: string): number {
  const prefix = database + '.'
  let sum = 0

  for (const [namespace, counts] of Object.entries(totals)) {
    if (!namespace.startsWith(prefix) || typeof counts !== 'object' || counts === null) continue

    for (const kind of KINDS) sum += (counts as Record<string, { count: number }>)[kind]?.count ?? 0
  }

  return sum
}

export function perRequest(window: Window): Counts {
  if (window.requests <= 0) throw new RangeError('A window with no requests has no rate per request')

  return { publish: per(window, 'publish'), operations: per(window, 'operations') }
}

function per(window: Window, key: keyof Counts): number {
  const { before, after, seconds, requests, background } = window

  return (after[key] - before[key] - background[key] * seconds) / requests
}

const KINDS = ['queries', 'getmore', 'insert', 'update', 'remove', 'commands']
