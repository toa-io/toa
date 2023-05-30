'use strict'

const { newid } = require('@toa.io/generic')
const { component: load } = require('@toa.io/norm')
const { deployment: { Factory } } = require('@toa.io/operations')
const runtime = require('@toa.io/runtime')

const find = require('../../util/find')

/**
 * @param {string[]} paths
 * @return {Promise<string>}
 */
async function build (paths) {
  const context = await createContext(/** @type {string[]} */ paths)
  const factory = new Factory(context)
  const registry = factory.registry()

  await registry.build()

  const composition = context.compositions[0].name

  return `${context.name}/composition-${composition}`
}

/**
 * @param {string[]} patterns
 * @return {Promise<toa.norm.Context>}
 */
async function createContext (patterns) {
  const paths = patterns.map((pattern) => find.components(pattern))
  const components = await loadComponents(paths)
  const rnd = newid().substring(0, 6)
  const name = 'replay-' + rnd

  return {
    name: 'toa-temp',
    runtime: {
      version: runtime.version
    },
    registry: {
      platforms: null
    },
    compositions: [{
      name,
      components
    }]
  }
}

/**
 * @param {string[]} paths
 * @return {Promise<toa.norm.Component[]>}
 */
async function loadComponents (paths) {
  const components = []

  for (const path of paths) {
    const component = await load(path)

    components.push(component)
  }

  return components
}

exports.build = build
