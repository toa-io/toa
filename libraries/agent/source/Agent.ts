import * as assert from 'node:assert'
import { trim } from '@toa.io/generic'
import { buffer } from '@toa.io/streams'
import * as http from './index'
import { request } from './request'
import * as parse from './parse'
import { Captures } from './Captures'
import type { Readable } from 'stream'

/*
It is extracted from the Exposition.
Use its features to test.

/extensions/exposition/features/identity.feature
 */

export class Agent {
  protected readonly origin: string
  protected response: string = ''

  public constructor (origin: string, private readonly captures: Captures = new Captures()) {
    this.origin = origin
  }

  public async request (input: string): Promise<any> {
    const substituted = this.captures.substitute(input)

    let [headers, body] = trim(substituted).split('\n\n')

    if (body !== undefined) headers += '\ncontent-length: ' + body?.length

    const message = headers + '\n\n' + (body ?? '')
    const response = await request(message, this.origin)
    const clone = response.clone()

    this.response = await parse.response(response)

    return clone
  }

  public responseIncludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      if (line.trim() === '') continue

      const match = this.captures.capture(this.response, line)

      if (match === null)
        throw new assert.AssertionError({
          message: `Response is missing '${line}'`,
          expected: line,
          actual: this.response.slice(0, 1024)
        })
    }
  }

  public responseExcludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const substituted = this.captures.substitute(line)

      if (this.response.includes(substituted))
        throw new assert.AssertionError({
          message: `Response contains '${line}'`,
          expected: line,
          actual: this.response.slice(0, 1024)
        })
    }
  }

  public async stream (head: string, stream: Readable): Promise<any> {
    head = trim(head) + '\n\n'
    head = this.captures.substitute(head)

    const {
      url,
      method,
      headers
    } = http.parse.request(head)

    const href = new URL(url, this.origin).href

    const request = {
      method,
      headers,
      body: stream as unknown as ReadableStream,
      duplex: 'half'
    }

    try {
      const response = await fetch(href, request)

      this.response = await http.parse.response(response)
    } catch (e: any) {
      console.error(e)
      console.error(e.cause)

      throw e
    }
  }

  public async streamMatch (head: string, stream: Readable): Promise<any> {
    const buf = await buffer(stream)
    const text = buf.toString('utf8')
    const expected = head + '\n\n' + text

    this.responseIncludes(expected)
  }
}
