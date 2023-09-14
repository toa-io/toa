'use strict'

// noinspection JSCheckFunctionSignatures
const lookup = jest.fn((host) => ({
  address: host === 'localhost' ? '127.0.0.1' : 'ip-of-' + host
}))

exports.lookup = lookup
