'use strict'

/** @type {toa.generic.Concat} */
const concat = (...args) => (args.findIndex(arg => arg === undefined || arg === null) === -1) ? args.join('') : ''

exports.concat = concat
