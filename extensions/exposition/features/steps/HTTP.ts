import * as assert from 'assert'
import { AssertionError } from 'assert'
import { binding, when, then } from 'cucumber-tsflow'
import * as http from '@toa.io/http'
import { trim } from '@toa.io/generic'
import { Parameters } from './parameters'
import { Gateway } from './Gateway'

@binding([Gateway, Parameters])
export class HTTP {
  private readonly gateway: Gateway
  private readonly origin: string
  private response: string = ''
  private readonly variables: Record<string, string> = {}

  public constructor (gateway: Gateway, parameters: Parameters) {
    this.gateway = gateway
    this.origin = parameters.origin
  }

  @when('the following request is received:')
  public async request (input: string): Promise<any> {
    let [headers, body] = trim(input).split('\n\n')

    if (body !== undefined)
      headers += '\ncontent-length: ' + body?.length

    const text = headers + '\n\n' + (body ?? '')
    const request = text.replaceAll(SUBSTITUTE, (_, name) => this.variables[name])

    await this.gateway.start()

    this.response = await http.request(request, this.origin)
  }

  @then('the following reply is sent:')
  public responseIncludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const expression = escaped.replace(CAPTURE,
        (_, name) => `(?<${name}>\\S{1,2048})`)

      const rx = new RegExp(expression, 'i')
      const match = this.response.match(rx)

      if (match === null)
        throw new AssertionError({ message: `Response is missing '${line}'\n${this.response}` })

      Object.assign(this.variables, match.groups)
    }
  }

  @then('the reply does not contain:')
  public responseExcludes (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      line.replace(SUBSTITUTE, (_, name) => this.variables[name])

      const includes = this.response.includes(line)

      assert.equal(includes, false, `Response contains '${line}'\n${this.response}`)
    }
  }
}

const CAPTURE = /\\\$\\{\\{ (?<name>[A-Za-z_]{0,32}) \\}\\}/g
const SUBSTITUTE = /\${{ (?<name>[A-Za-z_]{0,32}) }}/g
