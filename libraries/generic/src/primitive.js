'use strict'

/** @type {toa.generic.primitive} */
const primitive = (value) => PRIMITIVES.has(typeof value)

const PRIMITIVES = new Set(['undefined', 'boolean', 'number', 'string', 'symbol', 'bigint'])

exports.primitive = primitive
