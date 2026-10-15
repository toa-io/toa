import * as assert from 'node:assert'
import { binding, given, then, when } from 'specumber'

import * as boot from '@toa.io/boot'
import { Locator, type Remote } from '@toa.io/core'
import { Captures } from './Captures.ts'

@binding([Captures])
export class OTP {
  private captures: Captures
  private otp: Remote | null = null
  private issued = new Map<string, Array<{ authority: string; credentials: string }>>()
  private identities: string[] = []

  public constructor(captures: Captures) {
    this.captures = captures
  }

  @given('OTP for `{word}` in `{word}` authority is issued')
  public async issue(username: string, authority: string): Promise<void> {
    const code = await this.code(username, authority)

    this.captures.set(`${username}.otp`, btoa(`${username}:${code}`))
  }

  @given('OTP for `{word}` in `{word}` authority is issued for {word}')
  public async issueFor(username: string, authority: string, as: string): Promise<void> {
    const identity = this.captures.get(`${as}.id`)
    const code = await this.code(username, authority, identity)

    this.captures.set(`${username}.otp`, btoa(`${username}:${code}`))
    this.captures.set(`${username}.code`, code)
  }

  @given('{int} OTPs for `{word}` in `{word}` authority are issued')
  public async issueMany(
    count: number,
    username: string,
    authority: string
  ): Promise<void> {
    const issued = this.issued.get(username) ?? []

    for (let i = 0; i < count; i++)
      issued.push({
        authority,
        credentials: btoa(`${username}:${await this.code(username, authority)}`)
      })

    this.issued.set(username, issued)
  }

  @when('the OTPs of `{word}` are presented at once')
  public async present(username: string): Promise<void> {
    const otp = await this.remote()
    const issued = this.issued.get(username) ?? []

    const replies = await Promise.all(
      issued.map(async (input) => await otp.invoke('authenticate', { input }))
    )

    this.identities = replies.map((reply) => reply.identity.id)
  }

  @then('each resolves to the same identity')
  public same(): void {
    assert.equal(
      new Set(this.identities).size,
      1,
      `Identities: ${this.identities.join(', ')}`
    )
  }

  private async code(
    username: string,
    authority: string,
    identity?: string
  ): Promise<string> {
    const otp = await this.remote()
    const reply = await otp.invoke('issue', { input: { username, authority, identity } })

    assert.ok(typeof reply.code === 'string')

    return reply.code
  }

  private async remote(): Promise<Remote> {
    this.otp ??= await boot.remote(new Locator('otp', 'identity'))

    return this.otp
  }
}
