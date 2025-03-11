import * as assert from 'node:assert'
import * as providers from './providers'
import { load as parse } from 'cheerio'

export class Effect {
  /**
   * Base url for rendering
   */
  base
  from
  provider
  logs

  mount (context) {
    assert.ok(context.configuration.provider in providers, `Unknown mail provider ${context.configuration.provider}`)

    const Provider = providers[context.configuration.provider]

    this.provider = new Provider(context)
    this.from = context.configuration.from
    this.base = context.configuration.templates
    this.logs = context.logs
  }

  async execute ({ to, subject, text, template, data }) {
    if (to.endsWith('.null')) {
      this.logs.debug('Mail skipped', { to, template })

      return
    }

    const properties = template === undefined ? { text } : await this.html(template, data)

    if (subject !== undefined)
      properties.subject = subject

    const message = {
      ...properties,
      to,
      from: this.from
    }

    this.logs.debug('Sending mail', message)

    await this.provider.send(message)
  }

  async html (template, data) {
    const { title, html } = await this.render(template, data)

    /** @type {toa.extensions.mail.Message} */
    return { subject: title, html }
  }

  async render (template, data) {
    assert.ok(this.base !== undefined, 'Base url for rendering is not set, cannot send HTML mail')

    const url = new URL(`./${template}/`, this.base).href

    this.logs.debug('Requesting render', { url, data })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const type = response.headers.get('content-type')

    assert.ok(response.status >= 200 && response.status < 300, `Failed to render ${response.status}`)
    assert.ok(type === 'text/html', `Rendering reply must be text/html, ${type} received`)

    const html = await response.text()
    const $ = parse(html)
    const title = $('title').text()

    return { title, html }
  }
}
