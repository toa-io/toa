'use strict'

const { concat, letters: { up, down } } = require('@toa.io/libraries/generic')

/**
 * @param {string} prefix
 * @param {toa.pointer.URIs} uris
 * @returns {toa.deployment.dependency.Variable[]}
 */
const credentials = (prefix, uris) => {
  const variables = []

  for (const key of Object.keys(uris)) {
    const [namespace, name] = key.split('.')
    const entry = namespace + concat('-', name)

    const env = `TOA_${up(prefix)}_${up(entry)}_`
    const sec = `toa-${down(prefix)}-${down(entry)}`

    for (const property of ['username', 'password']) {
      const name = env + up(property)

      const secret = {
        name: sec,
        key: property
      }

      variables.push({ name, secret })
    }
  }

  return variables
}

exports.credentials = credentials
