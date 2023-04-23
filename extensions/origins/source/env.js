'use strict'

const { PREFIX } = require('./constants')
const { overwrite } = require('@toa.io/generic')

/**
 * @param {toa.core.Locator} locator
 * @param {toa.origins.annotation.Component} declaration
 */
function apply (locator, declaration) {
  const variable = PREFIX + locator.uppercase

  if (!(variable in process.env)) return

  const base64 = process.env[variable]
  const json = atob(base64)
  const value = JSON.parse(json)

  overwrite(declaration, value)
}

exports.apply = apply
