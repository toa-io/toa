import * as assert from 'node:assert'
import { binding, given } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { Locator, type Remote } from '@toa.io/core'
import { Captures } from './Captures'

@binding([Captures])
export class OTP {
  private captures: Captures
  private otp: Remote | null = null

  public constructor (captures: Captures) {
    this.captures = captures
  }

  @given('OTP for `{word}` in `{word}` authority is issued')
  public async issue (username: string, authority: string): Promise<void> {
    this.otp ??= await this.connect()

    const reply = await this.otp.invoke('issue', {
      input: {
        username,
        authority
      }
    })

    assert.ok(typeof reply.code === 'string')

    const credentials = btoa(`${username}:${reply.code}`)

    this.captures.set(`${username}.otp`, credentials)
  }

  private async connect (): Promise<Remote> {
    const locator = new Locator('otp', 'identity')

    return await boot.remote(locator)
  }
}
