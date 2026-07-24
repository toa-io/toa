import * as assert from 'node:assert'
import { functions } from './functions'
import type { Functions } from './functions'

export class Captures extends Map<string, string> {
  private readonly functions: Functions | undefined

  public constructor (functions?: Functions) {
    super()
    this.functions = functions
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

  /**
   * @returns `null` if `source` doesn't match `matcher`
   * or array of captured keys (can be empty) with `end` set to the index after the match
   */
  public capture (source: string, matcher: string): Capture | null {
    let i = 0

    matcher = this.substitute(matcher)

    const expression = PADDING + regexpEscape(matcher).replaceAll(CAPTURE,
      (_, name: string) => `(?<${Buffer.from(name + '#' + i++).toString('base64url')}>[^\\s"']{1,2048})`)

    const rx = new RegExp(expression, 'i')
    const match = source.match(rx)

    if (match === null) return null

    const keys = Object.entries(match.groups ?? {}).map(([key, value]) => {
      const parts = regexpUnescape(Buffer.from(key, 'base64url').toString()).split('#')
      const name = parts.slice(0, -1).join('#')

      this.set(name, value)

      return name
    }) as Capture

    Object.defineProperty(keys, 'end', {
      value: match.index! + match[0].length
    })

    return keys
  }
}

export type Capture = string[] & { readonly end: number }

function regexpEscape (text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function regexpUnescape (text: string): string {
  return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

const CAPTURE = /\\\$\\{\\{\s*(?<name>\S{0,32})\s*\\}\\}/g
const PADDING = '(?:^|\\s+)'
const PIPELINE = /#{{ (?<pipeline>[^}]{1,256}) }}/g
