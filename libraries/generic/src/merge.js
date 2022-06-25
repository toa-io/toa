'use strict'

/**
 * Modifies target
 *
 * @param target {Object}
 * @param source {Object}
 * @param options {{ override?: boolean, ignore?: boolean }}
 * @param path {Array<string>} internal property
 * @return {Object}
 */
const merge = (target, source, options = {}, path = []) => {
  if (target === undefined) target = {}
  if (source === undefined) source = {}

  if (source instanceof Array && target instanceof Array) {
    if (options.override === true) {
      target.length = 0
      target.push(...source)
    } else if (options.ignore !== true) target.push(...source)
  } else if (typeof source === 'object' && typeof target === 'object') {
    for (const [name, value] of Object.entries(source)) {
      path.push(name)

      if (source[name] !== undefined) {
        if (target[name] === undefined) target[name] = value
        else if (typeof value === 'object' && value !== null) {
          if (target[name] === undefined) target[name] = {}

          merge(target[name], value, options, path)
        } else if (target[name] !== value) {
          if (options.override === true) target[name] = value
          else if (options.ignore !== true) {
            throw new Error(`gears/merge: conflict at ${string(path)} ('${value}', '${target[name]}')`)
          }
        }
      }

      path.pop()
    }
  } else throw new TypeError(`gears/merge: arguments must be objects or arrays at ${string(path)}`)

  return target
}

const string = (path) => '/' + path.join('/')

exports.merge = merge
