import { createHash } from 'node:crypto'

/**
 * What a step asks, as a digest: the same arguments give the same one on every attempt, whatever
 * order an object's keys were written in.
 *
 * Only what a step is asked is read. A value no attempt can give twice — a function, a signal, a
 * stream — is told by its kind alone, so it neither tells two attempts apart nor fails to digest.
 */
export function fingerprint(args: unknown[]): string {
  const hash = createHash('sha1')

  write(hash, args, new Set())

  return hash.digest('hex')
}

type Hash = ReturnType<typeof createHash>

function write(hash: Hash, value: unknown, seen: Set<object>): void {
  if (value === null || typeof value !== 'object') {
    // the type as well, so that `1` and `'1'` are two different asks
    hash.update(typeof value + ':' + String(value) + ';')

    return
  }

  if (seen.has(value)) {
    hash.update('cycle;')

    return
  }

  seen.add(value)

  if (ArrayBuffer.isView(value)) {
    hash.update('bytes:')
    hash.update(value as Uint8Array)
    hash.update(';')
  } else if (value instanceof Date) hash.update('date:' + value.toISOString() + ';')
  else if (value instanceof URL) hash.update('url:' + value.href + ';')
  else if (Array.isArray(value)) {
    hash.update('[')

    for (const item of value) write(hash, item, seen)

    hash.update(']')
  } else if (plain(value)) {
    hash.update('{')

    for (const key of Object.keys(value).sort()) {
      const item = (value as Record<string, unknown>)[key]

      // absent and undefined are one ask, as they are once the request is on the wire
      if (item === undefined) continue

      hash.update(JSON.stringify(key) + '=')
      write(hash, item, seen)
    }

    hash.update('}')
  } else hash.update('<' + (value.constructor?.name ?? 'object') + '>;')

  seen.delete(value)
}

function plain(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}
