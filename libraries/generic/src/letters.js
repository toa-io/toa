'use strict'

/** @type {toa.generic.letters.Converter} */
const up = (string) => string.toUpperCase().replace('-', '_')

/** @type {toa.generic.letters.Converter} */
const down = (string) => string.toLowerCase().replace('_', '-')

exports.up = up
exports.down = down
