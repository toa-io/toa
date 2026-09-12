import { console } from './Console.ts'
import type { Registry } from './Registry.ts'
import { consoleMeter, measuring, metering, meters } from './meters.ts'
import { state } from './state.ts'
import type { Meter } from './meters.ts'

/**
 * Configures metrics: how often series are collected, and where they go.
 * Replaces the current configuration entirely.
 *
 * When `exporters` is omitted, metrics are off: nothing consumes a series, so none is collected.
 * The console exporter is a local development mechanism and is opted into explicitly; a
 * deployment configures `otlp`.
 *
 * The registry is not replaced. Instruments are declared where the code that records them is
 * built, which is before and after this is called, and an instrument that outlived a
 * reconfiguration is one whose series does not restart.
 */
export function metrics(options: MetricsOptions = {}): void {
  stop()

  metering(createMeters(options.exporters))

  if (!measuring()) return

  const interval = options.interval ?? INTERVAL

  // a collection is not a reason for the process to stay alive
  state.collector = setInterval(collect, interval).unref()

  process.once('beforeExit', beforeExit)
}

/** One collection, handed to every exporter. Called on the interval, and on the way out. */
export function collect(): void {
  if (!measuring()) return

  const series = state.registry.collect()

  for (const meter of meters()) meter.export(series, console)
}

export function registry(): Registry {
  return state.registry
}

function createMeters(config?: MetersConfig): Meter[] {
  if (config === undefined) return []

  const meters: Meter[] = []

  if ('console' in config) meters.push(consoleMeter)

  return meters
}

function stop(): void {
  if (state.collector === null) return

  clearInterval(state.collector)
  state.collector = null

  process.off('beforeExit', beforeExit)
}

function beforeExit(): void {
  collect()
}

const INTERVAL = 15_000

export interface MetricsOptions {
  /** milliseconds between collections, and so between exports */
  interval?: number

  exporters?: MetersConfig
}

export interface MetersConfig {
  console?: unknown
}
