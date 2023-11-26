'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { secrets } = require('@toa.io/kubernetes')
const { context: find } = require('../util/find')
const { promptSecrets } = require('./env')

const conceal = async (argv) => {
  if (argv.interactive) await concealValues(argv)
  else await concealValue(argv)
}

async function concealValue (argv) {
  if (argv['key-values'].length === 0) throw new Error('Key-values must be passed')

  const values = argv['key-values'].reduce((values, pair) => {
    const [key, value] = pair.split('=')

    values[key] = value

    return values
  }, {})

  const secret = PREFIX + argv.secret

  await secrets.upsert(secret, values, argv.namespace)
}

async function concealValues (argv) {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const operator = factory.operator()
  const variables = operator.variables()
  const values = await promptSecrets(variables)
  const groups = groupValues(values)

  for (const [secret, values] of Object.entries(groups)) {
    await secrets.upsert(secret, values, argv.namespace)
  }
}

/**
 * @return {Record<string, Record<string, string>>}
 */
function groupValues (values) {
  const secrets = {}

  for (const [key, value] of Object.entries(values)) {
    const [secret, variable] = key.split('/')

    if (!(secret in secrets)) secrets[secret] = {}

    secrets[secret][variable] = value
  }

  return secrets
}

const PREFIX = 'toa-'

exports.conceal = conceal
exports.PREFIX = PREFIX
