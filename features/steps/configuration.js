import { Given } from '@cucumber/cucumber'
import { load as parse } from 'js-yaml'
import { environment } from '@toa.io/generic'

import { deployment, describe } from '@toa.io/definitions/extensions.configuration'
import { load } from './.workspace/components/index.js'

Given(
  'the configuration of {component} is deployed',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    await deploy.call(this, reference)
  }
)

Given(
  'the configuration of {component} is deployed with:',
  /**
   * @param {string} reference
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (reference, yaml) {
    await deploy.call(this, reference, parse(yaml))
  }
)

Given(
  'the values service holds the configuration of {component} deployed with:',
  /**
   * A values service of another deployment than the component's: what it holds is set, and
   * nothing the component is given changes. Stated again with the component's values, it is
   * the values service of the component's own deployment, which has replaced it.
   *
   * @param {string} reference
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (reference, yaml) {
    await hold.call(this, await instance(reference), parse(yaml))
  }
)

/**
 * What the deployment would tell the values service about the component — its epoch, its
 * schema and its defaults — and what it would give the component, both computed by the
 * extension itself rather than written down here.
 *
 * @param {string} reference
 * @param {object} [values]
 * @this {toa.features.Context}
 */
async function deploy(reference, values) {
  const deployed = await instance(reference)
  const annotation = values === undefined ? {} : { [deployed.locator.id]: values }
  const variables =
    deployment([deployed], annotation).variables[deployed.locator.label] ?? []

  await hold.call(this, deployed, values)

  for (const { name, value } of variables) {
    if (value === undefined) continue // a secret, which a scenario sets itself

    this.env.push([name, environment.get(name)])
    environment.set(name, value)
  }
}

/**
 * @param {Instance} deployed
 * @param {object} [values]
 * @this {toa.features.Context}
 */
async function hold(deployed, values) {
  const annotation = values === undefined ? {} : { [deployed.locator.id]: values }
  const current = JSON.parse(environment.get(VARIABLE) ?? '{}')
  const map = { ...current, ...describe([deployed], annotation) }

  this.env.push([VARIABLE, environment.get(VARIABLE)])

  environment.set(VARIABLE, JSON.stringify(map))
}

/**
 * @param {string} reference
 * @returns {Promise<Instance>}
 */
async function instance(reference) {
  const manifest = await load(reference)

  return {
    locator: manifest.locator,
    manifest: manifest.extensions[REFERENCE],
    component: manifest
  }
}

/** @typedef {import('@toa.io/definitions/extensions.configuration').Instance} Instance */

const REFERENCE = '@toa.io/extensions.configuration'
const VARIABLE = 'TOA_CONFIGURATION_VALUES'
