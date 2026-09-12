import { state } from './state.ts'
import type { Console } from './Console.ts'
import type { Series } from './Registry.ts'

/**
 * Writes series as TRACE log entries using the emitting console, respecting its log level.
 *
 * The counterpart of `consoleExporter` for the other signal, and the same local development
 * mechanism: it is opted into, never on by default, because a collection writes every series
 * the process holds and does so on every interval.
 */
export const consoleMeter: Meter = {
  export(series: Series[], output: Console): void {
    for (const one of series) {
      const { name, labels, ...rest } = one

      output.entry('trace', name, { attributes: { ...labels, ...rest } })
    }
  }
}

/** Replaces the set of metrics exporters entirely. Defaults to none. */
export function metering(meters: Meter[]): void {
  state.meters = meters
}

export function meters(): Meter[] {
  return state.meters ?? NONE
}

/**
 * Whether anything at all consumes series. When nothing does, nothing is collected and the
 * instruments a measured site would reach for are never asked for a value.
 */
export function measuring(): boolean {
  return meters().length > 0
}

export async function flush(): Promise<void> {
  await Promise.all(meters().map(async (meter) => meter.flush?.()))
}

export interface Meter {
  export: (series: Series[], output: Console) => void
  flush?: () => Promise<void>
}

const NONE: Meter[] = []
