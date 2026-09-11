import assert from 'node:assert'
import { join } from 'node:path'
import { diff } from 'jest-diff'

import { readFile } from 'node:fs/promises'
import { load as parse } from 'js-yaml'
import { match } from '@toa.io/generic'

import * as extract from './.deployment/index.js'

import { When, Then } from '@cucumber/cucumber'

When('I export deployment', function () {
  return extract.deployment.call(this)
})

When('I export images', function () {
  return extract.images.call(this)
})

Then(
  'exporting deployment fails with:',
  /**
   * @param {string} message
   * @this {toa.features.Context}
   */
  async function (message) {
    await assert.rejects(extract.deployment.call(this), { message })
  }
)

When('I export deployment for {environment}', function (env) {
  return extract.deployment.call(this, env)
})

When('I export a mono deployment', function () {
  return extract.deployment.call(this, undefined, { mono: true })
})

When('I export a mono deployment for {environment}', function (env) {
  return extract.deployment.call(this, env, { mono: true })
})

Then(
  'exported {helm-artifact} should contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    await contains(this.cwd, artifact, text)
  }
)

Then(
  'exported {helm-artifact} should not contain:',
  /**
   * @param {string} artifact
   * @param {string} text
   * @return {Promise<void>}
   */
  async function (artifact, text) {
    await contains(this.cwd, artifact, text, false)
  }
)

Then('the exported composition image tag is the content hash', async function () {
  const path = join(this.cwd, 'deployment', 'values.yaml')
  const values = parse(await readFile(path, 'utf8'))

  for (const composition of values.compositions)
    assert.match(composition.image, /:[0-9a-f]{8}$/)
})

/**
 * @param {string} cwd
 * @param {string} artifact
 * @param {string} text
 */
const contains = async (cwd, artifact, text, expectation = true) => {
  const filename = artifact + '.yaml'
  const path = join(cwd, 'deployment', filename)
  const contents = parse(await readFile(path, 'utf8'))
  const expected = parse(text)

  const matches = match(contents, expected)

  assert.equal(matches, expectation, diff(expected, contents))
}
