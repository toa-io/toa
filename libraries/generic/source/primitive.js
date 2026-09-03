/** @type {toa.generic.primitive} */
export const primitive = (value) => PRIMITIVES.has(typeof value)

const PRIMITIVES = new Set(['undefined', 'boolean', 'number', 'string', 'symbol', 'bigint'])
