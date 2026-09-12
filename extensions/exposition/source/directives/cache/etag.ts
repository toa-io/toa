import { hash } from 'node:crypto'

/**
 * The tag of a reply, which is the body it holds: a client that sends it back in `if-none-match`
 * already has this reply and is told so, whatever the reply carries.
 */
export function tag(body: Buffer): string {
  return `"${hash('sha1', body, 'base64url')}"`
}

/** Whether the tag a client sent is this one, strong or weak. */
export function same(sent: string, tag: string): boolean {
  return sent === tag || sent === 'W/' + tag
}

/**
 * The version a tag names, or nothing for a tag that is not one. Read out of `if-match`, which
 * is another matter than validation: it carries the `VERSION` a client read in a body, which is
 * what an operation refuses a stale write by. See `documentation/cache.md`.
 */
export function parse(sent: string): number | null {
  const strong = sent.startsWith('W/') ? sent.slice(2) : sent

  if (
    strong.length < 3 ||
    strong.length > 34 ||
    !strong.startsWith('"') ||
    !strong.endsWith('"')
  )
    return null

  const digits = strong.slice(1, -1)

  for (let i = 0; i < digits.length; i++) {
    const code = digits.charCodeAt(i)

    if (code < 48 || code > 57) return null
  }

  return Number.parseInt(digits)
}
