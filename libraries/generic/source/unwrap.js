'use strict'

/**
 * The value itself, or what it unwraps to — a configuration secret hands out its string this way.
 *
 * @type {toa.generic.Unwrap}
 */
const unwrap = (value) => typeof value?.unwrap === 'function' ? value.unwrap() : value

exports.unwrap = unwrap
