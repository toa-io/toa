'use strict'

const { map } = require('@toa.io/generic')

function env (object) {
  return map(object,
    /**
     * @type {toa.generic.map.transform<string>}
     */
    (value) => {
      if (typeof value !== 'string') return

      return value.replaceAll(RX, (match, variable) => process.env[variable] ?? match)
    })
}

const RX = /\${(?<variable>[A-Z0-9_]{1,32})}/g

exports.env = env
