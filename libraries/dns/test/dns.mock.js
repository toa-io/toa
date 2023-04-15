'use strict'

// noinspection JSCheckFunctionSignatures
const lookup = jest.fn((host) => ({ address: 'ip-of-' + host }))

exports.lookup = lookup
