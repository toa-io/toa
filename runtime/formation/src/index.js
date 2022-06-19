'use strict'

const { context } = require('./context')
const { component } = require('./component')
const { resolve } = require('./lookup')

exports.resolve = resolve
exports.context = context
exports.component = component
