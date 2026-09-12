import { UNDECLARED } from 'openspan'
import * as schemas from './schemas.ts'
import type { Declaration, Instrument } from './types.ts'

/**
 * The `telemetry:` block of a component manifest: the metrics `context.metrics` carries. Read
 * here rather than left to fail at boot, so that a declaration a deployment cannot honour is a
 * deployment that does not happen.
 *
 * A component that declares nothing still has a declaration — telemetry is predefined, so every
 * component gets one — and an absent block is an aspect that carries no instruments.
 */
export function manifest(declaration: Declaration | null | undefined): Declaration {
  const normalized: Declaration = declaration ?? {}

  schemas.declaration.validate<Declaration>(normalized, 'Invalid telemetry declaration')

  for (const [name, instrument] of Object.entries(normalized.metrics ?? {}))
    validate(name, instrument)

  return normalized
}

function validate(name: string, instrument: Instrument): void {
  if (instrument.type === 'histogram') {
    if (instrument.buckets === undefined)
      throw new Error(`Histogram '${name}' declares no buckets`)

    ascending(name, instrument.buckets)
  } else if (instrument.buckets !== undefined)
    throw new Error(`Buckets are a histogram's, and '${name}' is a ${instrument.type}`)

  for (const [label, values] of Object.entries(instrument.labels ?? {}))
    if (values !== null && values.includes(UNDECLARED))
      throw new Error(
        `Label '${label}' of '${name}' enumerates '${UNDECLARED}', which is what a value ` +
          'outside the enumeration is recorded as'
      )
}

function ascending(name: string, buckets: number[]): void {
  for (let i = 1; i < buckets.length; i++)
    if (buckets[i] <= buckets[i - 1]) throw new Error(`Buckets of '${name}' must ascend`)
}
