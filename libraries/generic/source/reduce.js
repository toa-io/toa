/** @type {toa.generic.Reduce} */
export const reduce = (items, reducer) => {
  return items.reduce((accumulator, item) => {
    reducer(accumulator, item)

    return accumulator
  }, {})
}
