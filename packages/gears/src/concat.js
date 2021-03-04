'use strict'

const concat = (...args) => (args.findIndex(arg => arg === undefined || arg === null) === -1) ? args.join('') : ''

exports.concat = concat
