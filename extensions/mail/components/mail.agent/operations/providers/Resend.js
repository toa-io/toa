import * as assert from 'node:assert'
import * as resend from 'resend'

export class Resend {
  resend
  logs

  constructor (context) {
    const key = context.configuration.options?.key

    assert.ok(typeof key === 'string', 'Resend API key is not set')

    this.resend = new resend.Resend(key)
    this.logs = context.logs
  }

  /**
   * @param {toa.extensions.mail.Message} message
   * @return {Promise<void>}
   */
  async send (message) {
    await this.resend.emails.send(message)
  }
}
