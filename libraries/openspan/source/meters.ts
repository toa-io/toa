import { state } from './state.ts'
import type { Series } from './Registry.ts'

/**
 * Replaces the set of metrics exporters entirely. `null` turns measuring off altogether; an empty
 * set records into the registry and sends nowhere, which is what a process that is read from
 * inside itself wants.
 */
export function metering(meters: Meter[] | null): void {
  state.meters = meters
}

export function meters(): Meter[] {
  return state.meters ?? NONE
}

/**
 * Whether the process measures at all. There is no console exporter for this signal — a
 * cumulative counter printed as a line says neither a rate nor a comparison, and reading one
 * needs a backend — so measuring is a thing a deployment asks for rather than a thing a local
 * run falls into.
 */
export function measuring(): boolean {
  return state.meters !== null
}

export async function flushMeters(): Promise<void> {
  await Promise.all(meters().map(async (meter) => meter.flush?.()))
}

export interface Meter {
  export: (series: Series[]) => void
  flush?: () => Promise<void>
}

const NONE: Meter[] = []
