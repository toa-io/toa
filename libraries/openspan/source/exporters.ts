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

let registry: Exporter[] = [consoleExporter]

/**
 * Replaces the set of span exporters entirely.
 * Defaults to the console exporter.
 */
export function exporting (exporters: Exporter[]): void {
  registry = exporters
}

export function exporters (): Exporter[] {
  return registry
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
  status?: 'error'
}
