import * as http from '@toa.io/agent'
import { binding } from 'specumber'

@binding()
export class Captures extends http.Captures {
  public constructor() {
    super(functions)
  }
}

const functions: http.Functions = {
  otp: function (this: Captures, value: string, arg: string): string {
    const identity = this.get(arg + '.id')
    const code = this.get(arg + '.code')

    return Buffer.from(`${identity}:${code}`).toString('base64')
  },
  /** A string of the given length, for a body past a limit. */
  repeat: function (this: Captures, _: string, length: string): string {
    return 'x'.repeat(Number(length))
  }
}
