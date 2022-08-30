'use strict'

const { component } = require('./component')
const { shutdown } = require('./shutdown')

// staging always runs on local deployment environment
process.env.TOA_ENV = 'local'

exports.component = component
exports.shutdown = shutdown
