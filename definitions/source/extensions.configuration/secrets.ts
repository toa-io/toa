import { SECRET_RX } from './const.ts'

/**
 * A property declared `format: secret` is a `$NAME` reference, not a string.
 */
export function assertSecrets(schema: object, value: unknown, path = ''): void {
  if (format(schema) === 'secret') {
    if (value === undefined) return

    if (!(typeof value === 'string' && SECRET_RX.test(value)))
      throw new Error(
        `'${path || '.'}' is a secret and must be given as a $NAME reference.`
      )

    return
  }

  if (typeof value !== 'object' || value === null) return

  const record = schema as Record<string, unknown>

  if (Array.isArray(value)) {
    if (
      typeof record.items !== 'object' ||
      record.items === null ||
      Array.isArray(record.items)
    )
      return

    for (let i = 0; i < value.length; i++)
      assertSecrets(record.items as object, value[i], join(path, String(i)))

    return
  }

  const properties = record.properties as Record<string, object> | undefined
  const additional = record.additionalProperties

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const name = key.split('@')[0]
    const nested =
      properties?.[name] ??
      (typeof additional === 'object' && additional !== null ? additional : undefined)

    if (nested === undefined) continue

    assertSecrets(nested, child, join(path, key))
  }
}

function format(schema: object): string | undefined {
  return (schema as { format?: string }).format
}

function join(path: string, key: string): string {
  return path === '' ? key : path + '.' + key
}
