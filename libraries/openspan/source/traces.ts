import { sampling } from './tracing'
import { consoleExporter, exporting } from './exporters'
import { Otlp } from './Otlp'
import type { Exporter } from './exporters'
import type { OtlpOptions } from './Otlp'
import type { SamplingOptions } from './tracing'

/**
 * Configures tracing: sampling and span exporters.
 * Replaces the current configuration entirely.
 *
 * When `exporters` is omitted, tracing is off: nothing consumes a span, so none is
 * created. The console exporter is a local development mechanism and is opted into
 * explicitly (`{ exporters: { console: {} } }`); a deployment configures `otlp`.
 */
export function traces (options: TracesOptions = {}): void {
  sampling(options)
  exporting(createExporters(options.exporters))
}

function createExporters (config?: ExportersConfig): Exporter[] {
  if (config === undefined)
    return []

  const exporters: Exporter[] = []

  if ('console' in config)
    exporters.push(consoleExporter)

  if (config.otlp !== undefined)
    exporters.push(new Otlp(config.otlp))

  return exporters
}

export interface TracesOptions extends SamplingOptions {
  exporters?: ExportersConfig
}

export interface ExportersConfig {
  console?: unknown
  otlp?: OtlpOptions
}
