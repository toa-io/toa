'use strict'

const assert = require('node:assert')
const { join } = require('node:path')
const { diff } = require('jest-diff')

const { load, parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

const extract = require('./.deployment')

const { When, Then } = require('@cucumber/cucumber')

When('I export deployment',
  function () {
    return extract.deployment.call(this)
  })

When('I export images',
  function () {
    return extract.images.call(this)
  })

When('I export deployment for {word}',
  function (env) {
    return extract.deployment.call(this, env)
  })

Then('exported {helm-artifact} should contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    await contains(this.cwd, artifact, text)
  })

Then('exported {helm-artifact} should not contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    await contains(this.cwd, artifact, text)
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

  const matches = match(contents, expected)

  assert.equal(matches, true, diff(expected, contents))
}
