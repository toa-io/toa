'use strict'

const { criteria } = require('./query/criteria')
const { options } = require('./query/options')

const translate = (query) => ({ criteria: criteria(query.criteria), options: options(query.options) })

exports.translate = translate
