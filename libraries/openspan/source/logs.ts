import { consoleLogs, logging } from './sinks.ts'
import { OtlpLogs } from './OtlpLogs.ts'
import type { LogExporter } from './sinks.ts'
import type { OtlpLogsOptions } from './OtlpLogs.ts'

/**
 * Configures where log entries go. Replaces the current configuration entirely, and `logs()`
 * with nothing is the default.
 *
 * The exporters are independent of each other: the console writes the JSON line and is on unless
 * a configuration says otherwise, and `otlp` sends entries to an endpoint. Configuring one says
 * nothing about the other — a process that exports to a backend keeps printing unless it asks
 * not to, because what a pod writes to its stdout is read by more than the backend.
 */
export function logs(options: LogsOptions = {}): void {
  const exporters: LogExporter[] = []

  if (options.exporters?.console !== false) exporters.push(consoleLogs)

  if (options.exporters?.otlp !== undefined)
    exporters.push(new OtlpLogs(options.exporters.otlp))

  logging(exporters)
}

export interface LogsOptions {
  exporters?: LogExportersConfig
}

export interface LogExportersConfig {
  /** `false` stops the JSON line being written; anything else leaves it on */
  console?: boolean

  otlp?: OtlpLogsOptions
}
