'use strict'

const path = (locator, endpoint) => ['', locator.domain, locator.name, endpoint].join('/')
const method = 'POST'

exports.path = path
exports.method = method
