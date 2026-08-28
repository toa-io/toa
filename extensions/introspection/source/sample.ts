import { Readable } from 'node:stream'
import { REDACTED, SAMPLE_LIMIT } from './const'
import type { Outcome, Sample } from './model'

/**
 * Captures the payload of a call. Only reached when both the context and the
 * component have opted in, and never for a denied namespace.
 */
export function capture (input: unknown, outcome: Outcome): Sample {
  return { at: Date.now(), input: redact(input), outcome }
}

export function samplable (input: unknown): boolean {
  return !(input instanceof Readable)
}

function redact (value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object')
    return truncate(value)

  if (Array.isArray(value))
    return truncate(value.map(redact))

  const result: Record<string, unknown> = {}

  for (const [key, property] of Object.entries(value))
    result[key] = REDACTED.test(key) ? '***' : redact(property)

  return truncate(result)
}

/**
 * The map holds one sample per edge indefinitely, so a single oversized
 * payload must not become a permanent tenant of the collection.
 */
function truncate (value: unknown): unknown {
  let serialized: string

  try {
    serialized = JSON.stringify(value) ?? ''
  } catch {
    return '[unserializable]'
  }

  if (serialized.length <= SAMPLE_LIMIT)
    return value

  return '[truncated]'
}
