import { setDefaultTimeout } from '@cucumber/cucumber'

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://localhost:8000'
  }
}

setDefaultTimeout(10 * 1000)
process.env.TOA_DEV = '1'
