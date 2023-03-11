'use strict'

const path = (locator, endpoint) => ['', locator.namespace, locator.name, endpoint].join('/')
const method = 'POST'

exports.path = path
exports.method = method
