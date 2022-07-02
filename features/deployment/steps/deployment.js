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
    const components = table.transpose().raw()[0]

    await copy(components, this.directory)
  })

Given('I have context',
  async function () {
    await template(this.directory)
  })

Given('I have context with:',
  /**
   * @param {string} [additions]
   * @returns {Promise<void>}
   */
  async function (additions) {
    await template(this.directory, additions)
  })

When('I export deployment',
  async function () {
    const context = join(this.directory, 'context')
    const target = join(this.directory, 'deployment')
    const operator = await boot.deployment(context)

    await operator.export(target)
  })

Then('exported {helm-artifact} should contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    const filename = artifact + '.yaml'
    const path = join(this.directory, 'deployment', filename)
    const contents = await load(path)
    const expected = parse(text)

    assert.equal(match(contents, expected), true, `'${filename}' doesn't contain:\n${text}`)
  })
