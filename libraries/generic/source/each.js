'use strict'

/** @type {toa.generic.Each} */
const each = async (iterable, callback) => {
  let i = 0

  for (const item of iterable) await callback(item, i++)
}

exports.each = each
