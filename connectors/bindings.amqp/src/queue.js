'use strict'

const { concat } = require('@toa.io/libraries/generic')

const name = (locator, endpoint) => locator.domain + '.' + concat(locator.name, '.') + endpoint

exports.name = name
