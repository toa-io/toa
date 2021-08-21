'use strict'

const { criteria } = require('./query/criteria')
const { options } = require('./query/options')

const translate = (query) => ({
  criteria: query?.criteria && criteria(query.criteria),
  options: query?.options && options(query.options)
})

exports.translate = translate
