'use strict'

const merge = (target, source, options = {}, path = []) => {
  if (source instanceof Array && target instanceof Array) target.push(...source)
  else if (typeof source === 'object' && typeof target === 'object') {
    for (const [name, value] of Object.entries(source)) {
      path.push(name)

      if (source[name] === undefined) continue

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

      path.pop()
    }
  } else throw new TypeError(`gears/merge: arguments must be objects or arrays at ${string(path)}`)

  return target
}

const string = (path) => '/' + path.join('/')

exports.merge = merge
