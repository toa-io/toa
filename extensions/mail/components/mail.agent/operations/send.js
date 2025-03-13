const assert = require('node:assert')
const { Err } = require('error-value')
const providers = require('./providers')

class Effect {
  provider
  config
  logs

  mount (context) {
    assert.ok(context.configuration.provider in providers, `Unknown mail provider ${context.configuration.provider}`)

    const Provider = providers[context.configuration.provider]

    this.provider = new Provider(context)
    this.config = context.configuration
    this.logs = context.logs
  }

  async execute (message) {
    if (this.invalidSender(message.from))
      return ERR_INVALID_SENDER

    if (message.to.endsWith('.null')) {
      this.logs.debug('Mail skipped', { to: message.to })

      return
    }

    this.logs.debug('Sending mail', message)

    await this.provider.send(message)
  }

  invalidSender (from) {
    const domain = from.split('@')[1]
    const invalid = !this.config.domains.includes(domain)

    if (invalid)
      this.logs.debug('Sender domain not allowed', { domain })

    return invalid
  }
}

const ERR_INVALID_SENDER = new Err('INVALID_SENDER')

exports.Effect = Effect
