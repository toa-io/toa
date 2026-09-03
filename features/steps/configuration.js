import { Given } from '@cucumber/cucumber'
import { load as parse } from 'js-yaml'
import { describe } from '@toa.io/extensions.configuration'
import { load } from './.workspace/components/index.js'

Given('the configuration of {component} is deployed',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    await deploy.call(this, reference)
  })

Given('the configuration of {component} is deployed with:',
  /**
   * @param {string} reference
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (reference, yaml) {
    await deploy.call(this, reference, parse(yaml))
  })

/**
 * What the deployment would tell the values service about the component: its epoch, its
 * schema and its defaults, computed by the extension itself rather than written down here.
 *
 * @param {string} reference
 * @param {object} [values]
 * @this {toa.features.Context}
 */
async function deploy (reference, values) {
  const manifest = await load(reference)
  const instance = { locator: manifest.locator, manifest: manifest.extensions[REFERENCE], component: manifest }
  const annotation = values === undefined ? {} : { [manifest.locator.id]: values }
  const current = JSON.parse(process.env[VARIABLE] ?? '{}')
  const map = { ...current, ...describe([instance], annotation) }

  this.env.push([VARIABLE, process.env[VARIABLE]])

  process.env[VARIABLE] = JSON.stringify(map)
}

const REFERENCE = '@toa.io/extensions.configuration'
const VARIABLE = 'TOA_CONFIGURATION_VALUES'
