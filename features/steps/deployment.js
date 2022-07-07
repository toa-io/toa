'use strict'

const assert = require('node:assert')
const { join } = require('node:path')

const { load, parse } = require('@toa.io/libraries/yaml')
const { match } = require('@toa.io/libraries/generic')
const boot = require('@toa.io/boot')

const { When, Then } = require('@cucumber/cucumber')

When('I export deployment',
  async function () {
    const context = this.cwd
    const target = join(this.cwd, 'deployment')
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
    const matches = await contains(this.cwd, artifact, text)

    assert.equal(matches, true, `'${artifact}' doesn't contain:\n${text}`)
  })

Then('exported {helm-artifact} should not contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    const matches = await contains(this.cwd, artifact, text)

    assert.equal(matches, false, `'${artifact}' contain:\n${text}`)
  })

/**
 * @param {string} cwd
 * @param {string} artifact
 * @param {string} text
 * @return {Promise<boolean>}
 */
const contains = async (cwd, artifact, text) => {
  const filename = artifact + '.yaml'
  const path = join(cwd, 'deployment', filename)
  const contents = await load(path)
  const expected = parse(text)

  return match(contents, expected)
}
