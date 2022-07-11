'use strict'

/** @type {toa.generic.letters.Converter} */
const up = (string) => string.toUpperCase().replaceAll('-', '_')

/** @type {toa.generic.letters.Converter} */
const down = (string) => string.toLowerCase().replaceAll('_', '-')

exports.up = up
exports.down = down
