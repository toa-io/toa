import assert from 'node:assert'
import { Temporary } from './Temporary'

export class Test extends Temporary {
  public static readonly SECRETS = ['USERNAME', 'PASSWORD']

  public constructor (url: URL, secrets: Record<string, string>) {
    url.protocol = 'tmp:'

    super(url)

    assert(secrets.USERNAME !== undefined, 'Missing USERNAME')
    assert(secrets.PASSWORD !== undefined, 'Missing PASSWORD')
  }
}
