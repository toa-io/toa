/** The version a tag names, or nothing for a tag that is not one. Read out of `if-match`. */
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
