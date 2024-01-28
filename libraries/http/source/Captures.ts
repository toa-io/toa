import * as assert from 'node:assert'
import { binding } from 'cucumber-tsflow'

@binding()
export class Captures extends Map<string, string> {
  public override set (key: string, value: string): this {
    if (super.has(key))
      assert.equal(super.get(key),
        value,
        `Capture ${key} already with different value: ${super.get(key)}`)

    return super.set(key, value)
  }

  public override delete (key: string): boolean {
    throw new Error('Captures should not be deleted')
  }

  public override clear (): void {
    throw new Error('Captures should not be cleared')
  }

  public substitute (text: string): string {
    return text.replaceAll(SUBSTITUTE, (_, name: string) => this.get(name) ?? '')
  }

  /**
   * @returns `undefined` if `source` doesn't match `matcher`
   * or array of captured keys (may be empty)
   */
  public capture (source: string, matcher: string): readonly string[] | undefined {
    const expression = regexpEscape(matcher).replaceAll(CAPTURE,
      (_, name: string) => `(?<${Buffer.from(name).toString('base64url')}>\\S{1,2048})`)

    const rx = new RegExp(expression, 'i')
    const match = source.match(rx)

    if (match === null) return undefined

    return Object.entries(match.groups ?? {}).map(([key, value]) => {
      const name = regexpUnescape(Buffer.from(key, 'base64url').toString())

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
const SUBSTITUTE = /\${{\s*(?<name>\S{0,32})\s*}}/g
