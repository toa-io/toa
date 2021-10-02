'use strict'

const methods = ['lookup']
const endpoint = (id, method) => id + '.' + method
const endpoints = (domain, name) => methods.map((method) => endpoint(domain + '.' + name, method))

exports.methods = methods
exports.endpoint = endpoint
exports.endpoints = endpoints
