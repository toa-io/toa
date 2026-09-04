export const type = 'application/x-www-form-urlencoded'

/**
 * A form is read and never written: it is what an HTML form and a handful of protocols send,
 * and nothing asks for a reply in it.
 *
 * A name repeated in a form is a list, which is how a form says one — `URLSearchParams` keeps
 * every value, and a name given once stays the string it was written as.
 */
export function decode (buffer: Buffer, charset = 'utf-8'): any {
  const params = new URLSearchParams(buffer.toString(charset as BufferEncoding))
  const value: Record<string, string | string[]> = {}

  for (const name of new Set(params.keys())) {
    const values = params.getAll(name)

    value[name] = values.length === 1 ? values[0] : values
  }

  return value
}
