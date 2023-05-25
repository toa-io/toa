'use strict'

const { map } = require('@toa.io/generic')

function env (object) {
  return map(object,
    /**
     * @type {toa.generic.map.transform<string>}
     */
    (value) => {
      if (typeof value !== 'string') return

      return value.replaceAll(RX, (_, variable) => {
        if (!(variable in process.env)) throw new Error(`Configuration refers to environment variable '${variable}' which is not set`)

        return process.env[variable]
      })
    })
}

const RX = /\${(?<variable>[A-Z0-9_]{1,32})}/g

exports.env = env
