'use strict'

const endpoints = (operations) => {
  return operations.map(({ name, type, target }) => ({ name, type, target }))
}

exports.endpoints = endpoints
