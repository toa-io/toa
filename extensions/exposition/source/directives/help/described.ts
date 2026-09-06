import assert from 'node:assert'

/** What a resource, a method or a parameter says of itself, in the order it is written. */
export interface Described {
  title?: string
  description?: string

  /** what its methods are guarded by; see `guarded` */
  authenticated?: boolean
  private?: boolean
  protected?: boolean
  system?: boolean
}

/**
 * A bare value is the title: it is the short thing, and the one a client has somewhere to
 * put — a name is an address and reads as one. A sentence is written as a mapping, beside
 * the title it explains, and either may stand alone.
 */
export function described(subject: string, value: unknown): Described {
  const stated = typeof value === 'string' ? { title: value } : value

  assert.ok(
    typeof stated === 'object' && stated !== null && !Array.isArray(stated),
    `Directive ${subject}: the value is a title, or a \`title\` and a \`description\``
  )

  const { title, description, ...rest } = stated as Record<string, unknown>

  assert.ok(
    Object.keys(rest).length === 0,
    `Directive ${subject}: unknown ${Object.keys(rest)
      .map((key) => `'${key}'`)
      .join(', ')}`
  )

  assert.ok(
    title === undefined || (typeof title === 'string' && title.trim().length > 0),
    `Directive ${subject}: a title cannot be empty`
  )

  assert.ok(
    description === undefined ||
      (typeof description === 'string' && description.trim().length > 0),
    `Directive ${subject}: a description cannot be empty`
  )

  assert.ok(
    title !== undefined || description !== undefined,
    `Directive ${subject}: says nothing`
  )

  return {
    ...(title === undefined ? {} : { title: title as string }),
    ...(description === undefined ? {} : { description: description as string })
  }
}
