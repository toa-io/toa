'use strict'

const { concat } = require('@kookaburra/gears')

const name = (locator, endpoint) => locator.domain + '.' + concat(locator.name, '.') + endpoint

exports.name = name
