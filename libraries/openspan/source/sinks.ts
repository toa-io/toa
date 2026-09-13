import { state } from './state.ts'
import type { Console, Entry } from './Console.ts'

/**
 * Writes the entry as a JSON line to the streams of the console that emitted it.
 *
 * This is what a console did on its own until there was more than one place for an entry to go.
 * It stays the default, and a process that configures nothing prints exactly as it always has.
 */
export const consoleLogs: LogExporter = {
  export(entry: Entry, output: Console): void {
    output.print(entry)
  }
}

/**
 * Replaces the set of log exporters entirely. `null` restores the default, which is the console —
 * an empty set means silence, and the two are different answers.
 */
export function logging(sinks: LogExporter[] | null): void {
  state.sinks = sinks
}

export function sinks(): LogExporter[] {
  return state.sinks ?? DEFAULT
}

/** Flushes all log exporters, e.g. before `process.exit()`, which does not emit `beforeExit`. */
export async function flushLogs(): Promise<void> {
  await Promise.all(sinks().map(async (sink) => sink.flush?.()))
}

const DEFAULT: LogExporter[] = [consoleLogs]

export interface LogExporter {
  /**
   * Called for every entry a console writes, with the console that wrote it — which is what
   * carries the streams, the level and the context of the site it was written at.
   *
   * Must not throw: it is called from wherever the process logs, and the log is not a place
   * where a failure of the observation may become a failure of the work.
   */
  export: (entry: Entry, output: Console) => void

  flush?: () => Promise<void>
}
