import type { Registry } from './Registry.ts'
import { flushMeters, metering, meters } from './meters.ts'
import { observe } from './process.ts'
import { OtlpMetrics } from './OtlpMetrics.ts'
import { state } from './state.ts'
import type { Meter } from './meters.ts'
import type { OtlpMetricsOptions } from './OtlpMetrics.ts'

/**
 * Configures metrics: how often series are collected, and where they go. Replaces the current
 * configuration entirely, and `metrics()` with nothing turns them off.
 *
 * Being called at all is what turns measuring on, and an exporter is what sends what is measured
 * somewhere. A process configured without one records into its registry and posts nothing, which
 * is what a test reading its own process wants and costs no timer.
 *
 * The registry is not replaced. Instruments are declared where the code that records them is
 * built, which is before and after this is called, and an instrument that outlived a
 * reconfiguration is one whose series does not restart.
 */
export function metrics(options?: MetricsOptions): void {
  stop()

  if (options === undefined) {
    metering(null)

    return
  }

  metering(createMeters(options.exporters))

  observed(options.prefix ?? '')

  if (meters().length === 0) return

  const interval = options.interval ?? INTERVAL

  // a collection is not a reason for the process to stay alive
  state.collector = setInterval(collect, interval).unref()

  process.once('beforeExit', beforeExit)
}

/** One collection, handed to every exporter. Called on the interval, and on the way out. */
export function collect(): void {
  if (meters().length === 0) return

  const series = state.registry.collect()

  for (const meter of meters()) meter.export(series)
}

export function registry(): Registry {
  return state.registry
}

/** The process instruments are declared once, however often the rest is reconfigured. */
function observed(prefix: string): void {
  if (state.observed) return

  state.observed = true

  observe(state.registry, prefix)
}

function createMeters(config?: MetersConfig): Meter[] {
  if (config?.otlp === undefined) return []

  return [new OtlpMetrics(config.otlp)]
}

function stop(): void {
  if (state.collector === null) return

  clearInterval(state.collector)
  state.collector = null

  process.off('beforeExit', beforeExit)
}

function beforeExit(): void {
  void report()
}

/**
 * A last collection, sent. `process.exit()` emits no `beforeExit`, so a shutdown that means to
 * keep what the process measured says so.
 */
export async function report(): Promise<void> {
  collect()

  await flushMeters()
}

const INTERVAL = 15_000

export interface MetricsOptions {
  /** milliseconds between collections, and so between exports */
  interval?: number

  /** what the process instruments are named under, e.g. `toa` for `toa.process.memory` */
  prefix?: string

  exporters?: MetersConfig
}

export interface MetersConfig {
  otlp?: OtlpMetricsOptions
}
