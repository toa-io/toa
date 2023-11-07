import { setDefaultTimeout } from '@cucumber/cucumber'

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(30 * 1000)
process.env.TOA_DEV = '1'

// { octets: tmp:///exposition-octets }
process.env.TOA_STORAGES = '3gABpm9jdGV0c7h0bXA6Ly8vZXhwb3NpdGlvbi1vY3RldHM='
