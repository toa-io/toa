import * as assert from 'assert'
import { binding, when, then } from 'cucumber-tsflow'
import * as http from '@toa.io/http'
import { trim } from '@toa.io/generic'
import { Parameters } from './parameters'
import { Gateway } from './Gateway'

@binding([Parameters])
export class HTTP {
  private readonly origin: string
  private response: string = ''

  public constructor (parameters: Parameters) {
    this.origin = parameters.origin
  }

  @when('the following request is received:')
  public async request (input: string): Promise<any> {
    const request = trim(input) + '\n\n'

    await Gateway.start()
    this.response = await http.request(request, this.origin)
  }

  @then('the following reply is sent:')
  public checkResponse (expected: string): void {
    const lines = trim(expected).split('\n')

    for (const line of lines) {
      const includes = this.response.includes(line)

      assert.equal(includes, true, `Response is missing '${line}'\n${this.response}`)
    }
  }
}
