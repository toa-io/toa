'use strict'

const { context } = require('./context')
const { component } = require('./component')

exports.shortcuts = require('./shortcuts') // used by cli

exports.context = context
exports.component = component
