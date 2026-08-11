'use strict'

const assert = require('node:assert')
const http = require('node:http')
const { Given, When, Then, After } = require('@cucumber/cucumber')
const { consoleExporter, exporting } = require('openspan')
const { parse } = require('@toa.io/yaml')

Given('an HTTP endpoint responds with statuses {string}',
  /**
   * @param {string} declaration
   * @this {toa.features.Context}
   */
  async function(declaration) {
    const statuses = declaration.split(',').map((value) => Number(value.trim()))
    let attempt = 0

    this.fetchServer = http.createServer((_, response) => {
      const status = statuses[Math.min(attempt, statuses.length - 1)]

      attempt++
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ attempt }))
    })

    await new Promise((resolve) => this.fetchServer.listen(0, '127.0.0.1', resolve))

    const address = this.fetchServer.address()

    assert.notEqual(address, null)
    assert.notEqual(typeof address, 'string')

    this.fetchOrigin = `http://127.0.0.1:${address.port}`
  })

When('I fetch with:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(yaml) {
    const input = { ...parse(yaml), url: this.fetchOrigin }
    const reply = await this.connector.invoke('request', { input })

    if (reply.exception !== undefined) throw reply.exception
    if (reply.error !== undefined) throw new Error(reply.error.message)

    this.reply = reply.output
  })

Given('I capture fetch spans',
  /**
   * @this {toa.features.Context}
   */
  function() {
    this.fetchSpans = []
    exporting([{ export: (span) => this.fetchSpans.push(span) }])
  })

Then('a fetch span tree is recorded:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function(yaml) {
    const expected = parse(yaml)
    const name = `${expected.method} ${this.fetchOrigin}`
    const span = this.fetchSpans.find((span) => span.name === name)

    assert.notEqual(span, undefined, `Fetch span '${name}' was not recorded`)
    assert.equal(span.kind, 'internal')
    assert.equal(span.attributes['http.request.method'], expected.method)
    assert.equal(span.attributes['http.response.status_code'], expected.status)
    assert.equal(span.attributes['retry.attempts'], expected.attempts)

    const attempts = this.fetchSpans.filter((attempt) => attempt.parentId === span.spanId)

    assert.equal(attempts.length, expected.attempts)
    assert.equal(attempts.every((attempt) => attempt.kind === 'client'), true)
  })

After(
  /**
   * @this {toa.features.Context}
   */
  async function() {
    exporting([consoleExporter])

    if (this.fetchServer !== undefined)
      await new Promise((resolve, reject) => this.fetchServer.close((error) =>
        error === undefined ? resolve() : reject(error)))
  })
