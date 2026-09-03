/** @type {toa.generic.Concat} */
export const concat = (...args) => (args.findIndex(arg => arg === undefined || arg === null) === -1) ? args.join('') : ''
