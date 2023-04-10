'use strict'

const { cli } = require('./cli')
const { compose } = require('./compose')
const { discovery } = require('./discovery')
const { dev } = require('./dev')
const { remote } = require('./remote')

exports.mongodb = require('./mongodb')
exports.docker = require('./docker')

exports.cli = cli
exports.compose = compose
exports.discovery = discovery
exports.dev = dev
exports.remote = remote
