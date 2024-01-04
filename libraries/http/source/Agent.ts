import { AssertionError } from 'node:assert'
import { trim } from '@toa.io/generic'
import { buffer } from '@toa.io/streams'
import * as http from './index'
import { request } from './request'
import type { Readable } from 'stream'

/*
It is extracted from the Exposition.
Use its features to test.

/extensions/exposition/features/identity.feature
 */

export class Agent {
  protected readonly origin: string
  protected response: string = ''
  private readonly keys: Record<string, string> = {}
  private readonly values: Record<string, string> = {}

  public constructor (origin: string) {
    this.origin = origin
  }

  public async request (input: string): Promise<any> {
    const substituted = this.substitute(input)

    let [headers, body] = trim(substituted).split('\n\n')

    if (body !== undefined)
      headers += '\ncontent-length: ' + body?.length

    const message = headers + '\n\n' + (body ?? '')

    this.response = await request(message, this.origin)
  }

  public responseIncludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const expression = escape(line)
        .replace(CAPTURE, (_, name) => `(?<${this.key(name)}>\\S{1,2048})`)

      const rx = new RegExp(expression, 'i')
      const match = this.response.match(rx)

      if (match === null)
        throw new AssertionError({
          message: `Response is missing '${line}'`,
          expected: line,
          actual: this.response
        })

      Object.assign(this.values, match.groups)
    }
  }

  public responseExcludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      line.replace(SUBSTITUTE, (_, name) => this.get(name))

      const includes = this.response.includes(line)

      if (includes)
        throw new AssertionError({
          message: `Response contains '${line}'`,
          expected: line,
          actual: this.response
        })
    }
  }

  public async stream (head: string, stream: Readable): Promise<any> {
    head = trim(head) + '\n\n'
    head = this.substitute(head)

    const { url, method, headers } = http.parse.request(head)
    const href = new URL(url, this.origin).href

    const request = {
      method,
      headers,
      body: stream
    }

    try {
      const response = await fetch(href, request)

      this.response = await http.parse.response(response)
    } catch (e) {
      console.error(e)

      if (e instanceof Error) console.error(e.cause)

      throw e
    }
  }

  public async streamMatch (head: string, stream: Readable): Promise<any> {
    const buf = await buffer(stream)
    const text = buf.toString('utf8')
    const expected = head + '\n\n' + text

    this.responseIncludes(expected)
  }

  public set (name: string, value: string): void {
    const key = this.key(escape(name))

    this.values[key] = value
  }

  public get (name: string): string {
    const key = this.key(escape(name))

    return this.values[key] ?? ''
  }

  private key (variable: string): string {
    if (!(variable in this.keys))
      this.keys[variable] = 'var' + Math.random().toString(36).slice(2, 8)

    return this.keys[variable]
  }

  private substitute (text: string): string {
    return text.replaceAll(SUBSTITUTE, (_, name) => this.get(name))
  }
}

function escape (text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const CAPTURE = /\\\$\\{\\{ (?<name>\S{0,32}) \\}\\}/g
const SUBSTITUTE = /\${{ (?<name>\S{0,32}) }}/g
