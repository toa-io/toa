import { state } from './state'
import type { Console, Entry, Kind } from './Console'

/**
 * Writes spans as TRACE log entries using the emitting console, respecting its log level.
 *
 * Rendering a span as a line belongs here rather than on the console: a console writes
 * messages, and a span is not one. What it borrows is the writer — the level, the context and
 * the streams of whichever console emitted the span.
 */
export const consoleExporter: Exporter = {
  export (span: Span, output: Console): void {
    const entry: Partial<Entry> = {
      attributes: span.attributes as Record<string, any>,
      trace_id: span.traceId,
      span_id: span.spanId,
      duration: span.duration
    }

    if (span.parentId !== undefined)
      entry.parent_id = span.parentId

    if (span.kind !== 'internal')
      entry.kind = span.kind

    if (span.status !== undefined)
      entry.status = span.status

    output.entry('trace', span.name, entry)
  }
}

/**
 * Replaces the set of span exporters entirely.
 * Defaults to none: tracing is off until an exporter is configured.
 */
export function exporting (exporters: Exporter[]): void {
  state.exporters = exporters
}

export function exporters (): Exporter[] {
  return state.exporters ?? NONE
}

/**
 * Whether anything at all consumes spans. When nothing does, traces are not
 * sampled and spans are not created — see `decide()`.
 */
export function recording (): boolean {
  return exporters().length > 0
}

const NONE: Exporter[] = []

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
