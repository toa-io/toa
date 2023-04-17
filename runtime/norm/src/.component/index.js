'use strict'

const { collapse } = require('./collapse')
const { defaults } = require('./defaults')
const { dependencies } = require('./dependencies')
const { dereference } = require('./dereference')
const { expand } = require('./expand')
const { merge } = require('./merge')
const { normalize } = require('./normalize')
const { validate } = require('./validate')

exports.collapse = collapse
exports.defaults = defaults
exports.dependencies = dependencies
exports.dereference = dereference
exports.expand = expand
exports.merge = merge
exports.normalize = normalize
exports.validate = validate
