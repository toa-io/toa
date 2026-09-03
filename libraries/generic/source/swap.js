/**
 * @param {object} object
 * @return {object}
 */
export const swap = (object) => {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => ([value, key])))
}
