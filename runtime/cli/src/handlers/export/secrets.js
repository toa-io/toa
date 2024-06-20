'use strict'

const { console } = require('@toa.io/console')
const { context: find } = require('../../util/find')
const { deployment: { Factory } } = require('@toa.io/operations')

/**
 * @param {{ path: string, target: string, environment?: string }} argv
 * @returns {Promise<void>}
 */
const secrets = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const operator = factory.operator()
  const secrets = operator
    .variables()
    .filter(({ secret }) => secret !== undefined)
    .map(({ secret }) => secret)
    .sort((a, b) => a.name.localeCompare(b.name))

  const groups = []
  let current = null

  for (const secret of secrets) {
    if (current === null || current.name !== secret.name) {
      current = { name: secret.name, keys: new Set() }
      groups.push(current)
    }

    current.keys.add(secret.key)
  }

  for (const group of groups) {
    console.log(`${group.name}:`)

    for (const key of group.keys)
      console.log('  ' + key)
  }
}

exports.secrets = secrets
