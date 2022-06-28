'use strict'

const { complete } = require('./complete')
const { dependencies } = require('./dependencies')
const { dereference } = require('./dereference')
const { expand } = require('./expand')
const { normalize } = require('./normalize')
const { validate } = require('./validate')

exports.complete = complete
exports.dependencies = dependencies
exports.dereference = dereference
exports.expand = expand
exports.normalize = normalize
exports.validate = validate
