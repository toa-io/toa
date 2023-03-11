'use strict'

const { concat } = require('@toa.io/generic')

const name = (locator, endpoint) => locator.namespace + '.' + concat(locator.name, '.') + endpoint

exports.name = name
