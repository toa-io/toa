'use strict'

const assert = require('node:assert')
const { join } = require('node:path')

const { load, parse } = require('@toa.io/libraries/yaml')
const { match } = require('@toa.io/libraries/generic')
const boot = require('@toa.io/boot')

const { copy } = require('./.deployment/components')
const { template } = require('./.deployment/context')

const { Given, When, Then } = require('@cucumber/cucumber')

Given('I have components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   */
  async function (table) {
    const components = table.rows().map((row) => row[0])

    await copy(components, this.directory)
  })

Given('I have the context with:',
  /**
   * @param {string} [additions]
   * @returns {Promise<void>}
   */
  async function (additions) {
    await template(this.directory, additions)
  })

When('I have exported the deployment',
  async function () {
    const context = join(this.directory, 'context')
    const target = join(this.directory, 'deployment')
    const operator = await boot.deployment(context)

    await operator.export(target)
  })

Then('exported {helm-artifact} should contain:',
  async function (artifact, text) {
    const filename = artifact + '.yaml'
    const path = join(this.directory, 'deployment', filename)
    const contents = await load(path)
    const expected = parse(text)

    assert.equal(match(contents, expected), true, `${artifact} doesn't contain:\n${text}`)
  })
