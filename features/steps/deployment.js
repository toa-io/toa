'use strict'

const assert = require('node:assert')
const { join } = require('node:path')

const { load, parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

const { When, Then } = require('@cucumber/cucumber')

const deployment = require('./.deployment')

When('I export deployment',
  function () {
    return deployment.export.call(this)
  })

When('I export deployment for {word}',
  function (env) {
    return deployment.export.call(this, env)
  })

When('I export variables',
  /**
   * @this {toa.features.Context}
   */
  function () {

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
