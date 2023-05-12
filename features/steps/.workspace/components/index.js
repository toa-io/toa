'use strict'

const { remote } = require('./remote')
const { component } = require('./component')
const { composition } = require('./composition')
const { copy } = require('./copy')
const { load } = require('./load')
const { emit } = require('./emit')

exports.remote = remote
exports.component = component
exports.composition = composition
exports.copy = copy
exports.load = load
exports.emit = emit
