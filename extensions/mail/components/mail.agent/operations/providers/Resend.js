const { assert } = require('node:assert')
const { Resend: Client } = require('resend')

class Resend {
  resend
  logs

  constructor (context) {
    const key = context.configuration.options?.key

    assert.ok(typeof key === 'string', 'Resend API key is not set')

    this.resend = new Client(key)
    this.logs = context.logs
  }

  /**
   * @param {toa.extensions.mail.Message} message
   * @return {Promise<void>}
   */
  async send (message) {
    const { data, error } = await this.resend.emails.send(message)

    if (error !== null)
      this.logs.error('Resend error', error)
    else
      this.logs.debug('Email sent', data)
  }
}

exports.Resend = Resend
