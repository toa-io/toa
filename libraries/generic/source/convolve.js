/**
 * @param {Object} object
 * @param {string} [discriminator]
 * @returns {Object}
 * @example
 * // returns { foo: 'bar' }
 * convolve({ foo: 'bar', 'foo@staging': 'baz' })
 *
 * // returns { foo: 'baz' }
 * convolve({ foo: 'bar', 'foo@staging': 'baz' }, 'staging')
 *
 * // returns { foo: 'c' }
 * convolve({ foo: 'a', 'foo@bar': 'b', 'foo@foo': 'c' }, 'foo:bar')
 */
export const convolve = (object, discriminator) => {
  if (typeof object !== 'object' || object === null) return object

  const tags = discriminator === undefined ? [] : discriminator.split(':')
  const chosen = new Map()

  for (let [key, value] of Object.entries(object)) {
    value = convolve(value, discriminator)

    if (key.includes(MARKER)) {
      const [name, tag] = key.split(MARKER)

      if (name.length === 0) continue

      delete object[key]

      const rank = tags.indexOf(tag)

      if (rank === -1) continue

      const previous = chosen.get(name)

      if (previous !== undefined && previous <= rank) continue

      object[name] = value
      chosen.set(name, rank)
    }
  }

  return object
}

const MARKER = '@'
