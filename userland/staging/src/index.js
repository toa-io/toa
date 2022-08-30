'use strict'

const { component } = require('./component')
const { composition } = require('./composition')
const { remote } = require('./remote')
const { shutdown } = require('./shutdown')

// staging always runs on local deployment environment
process.env.TOA_ENV = 'local'

exports.component = component
exports.composition = composition
exports.remote = remote
exports.shutdown = shutdown
