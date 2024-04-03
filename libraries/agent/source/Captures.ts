import * as assert from 'node:assert'
import { functions } from './functions'
import type { Functions } from './functions'

export class Captures extends Map<string, string> {
  private readonly functions: Functions | undefined

  public constructor (functions?: Functions) {
    super()
    this.functions = functions
  }

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

    text = text.replaceAll(PIPELINE, (_: string, pipeline: string) => {
      let value = ''

      const expressions = pipeline.split('|').map((expression) => expression.trim())

      for (const expression of expressions) {
        const [fn, ...args] = expression.split(/\s+/)
        const f = this.functions?.[fn] ?? functions[fn]

        assert.ok(f !== undefined, `Unknown pipeline function: ${fn}`)

        value = f.call(this, value, ...args)
      }

      return value
    })

    return text
  }

  // GET /2e87be116aa84c378f5267738170aefe/ HTTP/1.1
  // host: the.one.com
  // authorization: Basic ODM0NDIyOTRjNDNhNDM4MzliN2FlOWRlZjY2MzliMWM6Z29DZEJiYyU=

  /**
   * @returns `undefined` if `source` doesn't match `matcher`
   * or array of captured keys (can be empty)
   */
  public capture (source: string, matcher: string): readonly string[] | null {
    let i = 0

    matcher = this.substitute(matcher)

    const expression = PADDING + regexpEscape(matcher).replaceAll(CAPTURE,
      (_, name: string) => `(?<${Buffer.from(name + '#' + i++).toString('base64url')}>\\S{1,2048})`)

    const rx = new RegExp(expression, 'i')
    const match = source.match(rx)

    if (match === null) return null

    return Object.entries(match.groups ?? {}).map(([key, value]) => {
      const parts = regexpUnescape(Buffer.from(key, 'base64url').toString()).split('#')
      const name = parts.slice(0, -1).join('#')

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
const PIPELINE = /#{{ (?<pipeline>[^}]{1,256}) }}/g
