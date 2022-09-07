'use strict'

const { load } = require('./load')
const { annexes } = require('./annexes')
const { tenants } = require('./tenants')
const { component } = require('./component')
const { context } = require('./context')

exports.annexes = annexes
exports.component = component
exports.context = context
exports.load = load
exports.tenants = tenants
