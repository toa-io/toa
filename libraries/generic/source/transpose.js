/** @type {toa.generic.Transpose} */
export const transpose = (array) => {
  if (!Array.isArray(array[0])) array = [array]

  return array[0].map((_, col) => array.map(row => row[col]))
}
