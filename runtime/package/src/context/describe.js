'use strict'

const { merge } = require('@toa.io/gears')

const describe = (manifest, key, extra = {}) => merge({
  domain: manifest.domain,
  name: manifest.name,
  annotations: manifest.annotations?.[key]
}, extra)

exports.describe = describe
