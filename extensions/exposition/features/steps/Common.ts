import * as assert from 'node:assert'
import tsflow from 'cucumber-tsflow'
import { timeout } from '@toa.io/generic'
import { Captures } from './Captures.js'

const { binding, given } = tsflow

@binding([Captures])
export class Common {
  private readonly captures: Captures

  public constructor (captures: Captures) {
    this.captures = captures
  }

  @given('after {float} second(s)')
  public async timeout (interval: number): Promise<void> {
    await timeout(interval * 1000)
  }

  @given('the process is running')
  public async noop (): Promise<void> {
  }

  /**
   * A remote resource is whatever it is today. A scenario downloading one compares the reply
   * against what the origin actually serves, not against a literal that goes stale when it changes.
   */
  @given('the length of `{}` is captured as `{word}`')
  public async length (url: string, name: string): Promise<void> {
    const response = await fetch(url)

    assert.equal(response.status, 200, `${url} answered ${response.status}`)

    const body = await response.arrayBuffer()

    this.captures.set(name, String(body.byteLength))
  }
}
