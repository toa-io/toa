'use strict'

const { concat, decode, letters: { up, capitalize } } = require('@toa.io/libraries/generic')
const { console } = require('@toa.io/libraries/console')

const { resolve } = require('../uris')

/**
 * @param {string} prefix
 * @param {toa.core.Locator} locator
 */
const env = (prefix, locator) => {
  const key = `TOA_${up(prefix)}_POINTER`
  const value = process.env[key]

  if (value === undefined) throw new Error(`Environment variable ${key} is not set`)

  const uris = decode(value)
  const { url, entry } = resolve(locator, uris)

  // url.host = locator.hostname(prefix)

  const suffix = convert(entry)
  const env = `TOA_${up(prefix)}_${suffix}`

  for (const property of ['username', 'password']) {
    const value = process.env[env + '_' + up(property)]

    if (value !== undefined) url[property] = value
    else console.warn(`${capitalize(property)} for ${env} is not set`)
  }

  return url
}

/**
 * @param {string} entry
 * @returns {string}
 */
const convert = (entry) => {
  const [namespace, name] = entry.toUpperCase().split('.')

  return namespace + concat('_', name)
}

exports.env = env
