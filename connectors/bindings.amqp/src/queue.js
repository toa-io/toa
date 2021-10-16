'use strict'

const { concat } = require('@toa.io/gears')

const name = (locator, endpoint) => locator.domain + '.' + concat(locator.name, '.') + endpoint

exports.name = name
