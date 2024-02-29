import * as assert from 'node:assert'

export class Captures extends Map<string, string> {
  public override set (key: string, value: string): this {
    if (super.has(key))
      assert.equal(super.get(key),
        value,
        `Capture ${key} already has different value: ${super.get(key)}`)

    return super.set(key, value)
  }

  public substitute (text: string): string {
    for (const [key, value] of this.entries())
      text = text.replaceAll(`\${{ ${key} }}`, value)

    return text
  }

  /**
   * @returns `undefined` if `source` doesn't match `matcher`
   * or array of captured keys (can be empty)
   */
  public capture (source: string, matcher: string): readonly string[] | null {
    let i = 0

    matcher = this.substitute(matcher)

    const expression = PADDING + regexpEscape(matcher).replaceAll(CAPTURE,
      (_, name: string) => `(?<${Buffer.from(name + '.' + i++).toString('base64url')}>\\S{1,2048})`)

    const rx = new RegExp(expression, 'i')
    const match = source.match(rx)

    if (match === null) return null

    return Object.entries(match.groups ?? {}).map(([key, value]) => {
      const [name] = regexpUnescape(Buffer.from(key, 'base64url').toString()).split('.')

      this.set(name, value)

      return name
    })
  }
}

function regexpEscape (text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function regexpUnescape (text: string): string {
  return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

const CAPTURE = /\\\$\\{\\{\s*(?<name>\S{0,32})\s*\\}\\}/g
const PADDING = '(?:^|\\s+)'
