/**
 * A copy of a request or a reply fit for a log line: the values under the names a
 * credential travels by are replaced, whatever their depth.
 */
export function redact<T> (value: T): T {
  if (value === null || typeof value !== 'object' || value instanceof Error)
    return value

  if (Array.isArray(value))
    return value.map(redact) as T

  const copy: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(value))
    copy[key] = SENSITIVE.has(key) ? REDACTED : redact(item)

  return copy as T
}

const SENSITIVE = new Set(['password', 'credentials', 'token', 'key', 'secret', 'code'])
const REDACTED = '[redacted]'
