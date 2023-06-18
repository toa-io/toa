import * as assert from 'assert'
import { binding, when, then, WorldParameters } from 'cucumber-tsflow'
import * as http from '@toa.io/http'
import { trim } from '@toa.io/generic'
import { type Parameters } from './parameters'

@binding([WorldParameters])
export class HTTP {
  private readonly origin: string
  private response: string = ''

  public constructor (parameters: WorldParameters<Parameters>) {
    this.origin = parameters.value.origin
  }

  @when('the following request is received:')
  public async request (input: string): Promise<any> {
    const request = trim(input) + '\n\n'

    this.response = await http.request(request, this.origin)
  }

  @then('the following reply is sent:')
  public checkResponse (expected: string): void {
    const lines = trim(expected)
      .split('\n')

    for (const line of lines) {
      const includes = this.response.includes(line)

      assert.equal(includes, true, `Response is missing '${line}'`)
    }
  }
}
