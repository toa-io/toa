'use strict'

const up = (string) => string.toUpperCase().replaceAll('-', '_')
const down = (string) => string.toLowerCase().replaceAll('_', '-')
const capitalize = (string) => string[0].toUpperCase() + string.substring(1)

exports.up = up
exports.down = down
exports.capitalize = capitalize
