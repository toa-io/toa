'use strict'

const { map } = require('@toa.io/generic')

/**
 * @param {object} configuration
 * @param {(variable: string, name?: string) => void} callback
 * @returns {object}
 */
function secrets (configuration, callback) {
  return map(configuration, (value) => {
    if (typeof value !== 'string') return

    const match = value.match(SECRET_RX)

    if (match === null) return

    const name = match.groups.variable
    const variable = PREFIX + name

    return callback(variable, name)
  })
}

const PREFIX = 'TOA_CONFIGURATION__'
const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/

exports.secrets = secrets
