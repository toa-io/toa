'use strict'

const concat = (...args) => (args.findIndex(arg => arg === undefined) === -1) ? args.join('') : ''

exports.concat = concat
