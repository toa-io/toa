'use strict'

/** @type {toa.generic.letters.Converter} */
const up = (string) => string.toUpperCase().replaceAll('-', '_')

/** @type {toa.generic.letters.Converter} */
const down = (string) => string.toLowerCase().replaceAll('_', '-')

/** @type {toa.generic.letters.Converter} */
const capitalize = (string) => string[0].toUpperCase() + string.substring(1)

exports.up = up
exports.down = down
exports.capitalize = capitalize
