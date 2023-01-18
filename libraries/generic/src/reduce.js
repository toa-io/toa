'use strict'

/** @type {toa.generic.Reduce} */
const reduce = (items, reducer) => {
  return items.reduce((accumulator, item) => {
    reducer(accumulator, item)

    return accumulator
  }, {})
}

exports.reduce = reduce
