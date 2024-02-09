import { setDefaultTimeout } from '@cucumber/cucumber'

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(30 * 1000)
process.env.TOA_DEV = '1'

// take this value form /features/extensions/storages.feature#Deploying S3 storage with secrets
process.env.TOA_STORAGES = '3gABo3RtcN4AAqhwcm92aWRlcqJzM6ZidWNrZXSkdGVzdA=='
