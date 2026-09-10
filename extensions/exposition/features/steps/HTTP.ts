import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import tsflow from 'cucumber-tsflow'

import * as http from '@toa.io/agent'
import * as msgpack from 'msgpackr'
import * as YAML from 'js-yaml'
import { Captures } from './Captures.js'
import { Parameters } from './Parameters.js'
import { Gateway } from './Gateway.js'
import type { Readable } from 'node:stream'

const { binding, then, when } = tsflow

@binding([Gateway, Parameters, Captures])
export class HTTP extends http.Agent {
  private readonly gateway: Gateway

  /** The parts of a reply that streams, left to be read by a later step. */
  private opened: AsyncIterable<{ body: Uint8Array | string }> | null = null

  public constructor(gateway: Gateway, parameters: Parameters, captures: Captures) {
    super(parameters.origin, captures)
    this.gateway = gateway
  }

  @when('the following request is received:')
  public override async request(input: string): Promise<any> {
    await this.gateway.start()

    await super.request(input)
  }

  @then('the following reply is sent:')
  public override responseIncludes(expected: string): void {
    super.responseIncludes(expected)
  }

  @then('response body contains {word}-encoded value:')
  public async bodyIs(format: string, yaml: string): Promise<void> {
    assert.ok(this.bytes !== null, 'Response body is not available')

    const value = encoders[format]?.(this.bytes)
    const expected = YAML.load(yaml)

    assert.deepEqual(value, expected, 'Values are not equal')
  }

  @then('the reply does not contain:')
  public override responseExcludes(expected: string): void {
    super.responseExcludes(expected)
  }

  @when('the stream of `{word}` is received with the following headers:')
  public async streamRequest(filename: string, head: string): Promise<any> {
    const stream = open(filename)

    await this.gateway.start()
    await super.stream(head, stream)
  }

  @then('the stream equals to `{word}` is sent with the following headers:')
  public async responseStreamMatch(filename: string, head: string): Promise<any> {
    const stream = open(filename)

    await super.streamMatch(head, stream)
  }

  @when('the following stream is received:')
  public async open(input: string): Promise<void> {
    await this.gateway.start()

    this.opened = (await this.parts(input)) as AsyncIterable<{ body: Uint8Array | string }>
  }

  @then('the stream ends with `{word}`')
  public async streamEnds(expected: string): Promise<void> {
    assert.ok(this.opened !== null, 'No stream has been opened')

    let last: string | null = null

    for await (const part of this.opened) last = Buffer.from(part.body).toString()

    assert.strictEqual(last, expected)
  }

  @when('the following request is interrupted after {float} second(s):')
  public async interrupt(delay: number, input: string): Promise<any> {
    const controller = new AbortController()

    await this.gateway.start()

    setTimeout(() => {
      if (pending) controller.abort()
      else console.error('Request cannot be interrupted as it is already completed')
    }, delay * 1000)

    let pending = true

    await super.fetch(input, { signal: controller.signal }).catch((e) => {
      if (e.name !== 'AbortError') throw e
    })

    pending = false
  }
}

const FILES_DIR = path.resolve(import.meta.dirname, '../../../storages/source/test')

function open(filename: string): Readable {
  return fs.createReadStream(path.join(FILES_DIR, filename))
}

const encoders: Record<string, (buf: Buffer | Uint8Array) => any> = {
  MessagePack: msgpack.decode
}
