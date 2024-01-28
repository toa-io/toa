import { binding, then, when } from 'cucumber-tsflow'
import * as http from '@toa.io/http'
import { open } from '../../../storages/source/test/util'
import { Parameters } from './Parameters'
import { Gateway } from './Gateway'

@binding([Gateway, Parameters, http.Captures])
export class HTTP extends http.Agent {
  private readonly gateway: Gateway

  public constructor (gateway: Gateway, parameters: Parameters, captures: http.Captures) {
    super(parameters.origin, captures)
    this.gateway = gateway
  }

  @when('the following request is received:')
  public override async request (input: string): Promise<any> {
    await this.gateway.start()
    await super.request(input)
  }

  @then('the following reply is sent:')
  public override responseIncludes (expected: string): void {
    super.responseIncludes(expected)
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
