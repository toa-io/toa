import { context as find } from '../../util/find.js'
import { deployment } from '@toa.io/operations'

const { Factory } = deployment

/**
 * @param {{ path: string, target: string, environment: string }} argv
 * @returns {Promise<void>}
 */
export const secrets = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const operator = await factory.operator()
  const secrets = operator
    .variables()
    .filter(({ secret }) => secret !== undefined)
    .map(({ secret }) => secret)
    .sort((a, b) => a.name.localeCompare(b.name))

  const groups = []
  let current = null

  for (const secret of secrets) {
    if (current === null || current.name !== secret.name) {
      current = { name: secret.name, keys: new Map() }
      groups.push(current)
    }

    current.keys.set(secret.key, secret.optional)
  }

  for (const group of groups) {
    console.log(`${group.name}:`)

    for (const [key, optional] of group.keys)
      console.log('  ' + key + (optional ? ' (optional)' : ''))
  }
}
