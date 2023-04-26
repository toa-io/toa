'use strict'

const { PREFIX } = require('./constants')
const { overwrite, remap, letters: { up } } = require('@toa.io/generic')

/**
 * @param {toa.core.Locator} locator
 * @param {toa.origins.Manifest} manifest
 */
function apply (locator, manifest) {
  const variable = PREFIX + locator.uppercase
  const envValue = readEnv(variable)

  overwrite(manifest, envValue)
  addCredentials(manifest, variable)
}

function readEnv (variable) {
  if (!(variable in process.env)) return

  const base64 = process.env[variable]
  const json = atob(base64)

  return JSON.parse(json)
}

/**
 * @param {toa.origins.Manifest} manifest
 * @param {string} variable
 */
function addCredentials (manifest, variable) {
  const prefix = variable + '_'

  remap(manifest, (reference, origin) => {
    const originPrefix = prefix + up(origin)
    const username = process.env[originPrefix + '_USERNAME']
    const password = process.env[originPrefix + '_PASSWORD']

    if (username === undefined && password === undefined) return

    const url = new URL(reference)

    url.username = username
    url.password = password

    manifest[origin] = url.href
  })
}

exports.apply = apply
