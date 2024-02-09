import { setDefaultTimeout } from '@cucumber/cucumber'
import { encode } from '@toa.io/generic'

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(30 * 1000)

process.env.TOA_DEV = '1'

process.env.TOA_STORAGES = encode({
  octets: {
    provider: 'tmp',
    prefix: 'test'
  }
})
