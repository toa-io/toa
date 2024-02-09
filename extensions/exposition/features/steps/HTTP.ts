import * as assert from 'node:assert'
import { binding, then, when } from 'cucumber-tsflow'
import * as http from '@toa.io/http'
import * as msgpack from 'msgpackr'
import * as YAML from 'js-yaml'
import { open } from '../../../storages/source/test/util'
import { Captures } from './Captures'
import { Parameters } from './Parameters'
import { Gateway } from './Gateway'

@binding([Gateway, Parameters, Captures])
export class HTTP extends http.Agent {
  private readonly gateway: Gateway
  private fetched: Response | null = null

  public constructor (gateway: Gateway, parameters: Parameters, captures: Captures) {
    super(parameters.origin, captures)
    this.gateway = gateway
  }

  @when('the following request is received:')
  public override async request (input: string): Promise<any> {
    await this.gateway.start()
    this.fetched = await super.request(input)
  }

  @then('the following reply is sent:')
  public override responseIncludes (expected: string): void {
    super.responseIncludes(expected)
  }

  @then('response body contains {word}-encoded value:')
  public async bodyIs (format: string, yaml: string): Promise<void> {
    assert.ok(this.fetched !== null, 'Response is null')

    const buf = await this.fetched.arrayBuffer()
    const value = encoders[format]?.(buf as Buffer)
    const expected = YAML.load(yaml)

    assert.deepEqual(value, expected, 'Values are not equal')
  }

  @then('the reply does not contain:')
  public override responseExcludes (expected: string): void {
    super.responseExcludes(expected)
  }

  @when('the stream of `{word}` is received with the following headers:')
  public async streamRequest (filename: string, head: string): Promise<any> {
    const stream = open(filename)

    await this.gateway.start()
    await super.stream(head, stream)
  }

  @then('the stream equals to `{word}` is sent with the following headers:')
  public async responseStreamMatch (filename: string, head: string): Promise<any> {
    const stream = open(filename)

    await super.streamMatch(head, stream)
  }
}

const encoders: Record<string, (buf: Buffer | Uint8Array) => any> = {
  MessagePack: msgpack.decode
}
