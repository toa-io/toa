import { state } from './state'
import type { Console, Kind } from './Console'

/**
 * Writes spans as TRACE log entries using the emitting console,
 * respecting its log level.
 */
export const consoleExporter: Exporter = {
  export (span: Span, output: Console): void {
    output.trace(span)
  }
}

/**
 * Replaces the set of span exporters entirely.
 * Defaults to the console exporter.
 */
export function exporting (exporters: Exporter[]): void {
  state.exporters = exporters
}

export function exporters (): Exporter[] {
  return state.exporters ?? [consoleExporter]
}

/**
 * Flushes all exporters, e.g. before `process.exit()`,
 * which does not emit `beforeExit`.
 */
export async function flush (): Promise<void> {
  await Promise.all(exporters().map(async (exporter) => exporter.flush?.()))
}

export interface Exporter {
  export: (span: Span, output: Console) => void
  flush?: () => Promise<void>
}

export interface Span {
  name: string
  traceId: string
  spanId: string
  parentId?: string
  kind: Kind
  time: number // span start, milliseconds since epoch
  duration: number // milliseconds
  attributes?: object
  scope?: object // context of the emitting console (namespace, component, operation)
  service?: string // the logical service emitting the span (`service.name`)
  status?: 'error'
}
