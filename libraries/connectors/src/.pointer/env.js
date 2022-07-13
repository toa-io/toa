'use strict'

const { decode, letters: { up } } = require('@toa.io/libraries/generic')

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
  const url = resolve(locator, uris)

  const env = `TOA_${up(prefix)}_${locator.uppercase}_`

  for (const property of ['username', 'password']) {
    const value = process.env[env + up(property)]

    if (value !== undefined) url[property] = value
  }

  return url
}

exports.env = env
