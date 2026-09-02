/**
 * @param {object} object
 * @return {object}
 */
const swap = (object) => {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => ([value, key])))
}

export { swap }
