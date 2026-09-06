/**
 * An entity tag is its version in quotes, `"3"`, or the same marked weak, `W/"3"`. A client
 * sends one back in `if-match` and `if-none-match`; what it sent is compared here as a string
 * and parsed only where a version is needed of it.
 */
export function tag(version: number): string {
  return `"${version}"`
}

/** Whether the tag a client sent names the version, strong or weak. */
export function matches(sent: string, version: number): boolean {
  const strong = tag(version)

  return sent === strong || sent === 'W/' + strong
}

/** The version a tag names, or nothing for a tag that is not one. */
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
