'use strict'

const merge = (target, source, path = []) => {
  if (source instanceof Array) target.push(...source)
  else if (typeof source === 'object') {
    if (typeof target !== 'object' || target === null) throw new TypeError(`Merge type mismatch at ${string(path)}`)

    for (const [name, value] of Object.entries(source)) {
      path.push(name)

      if (target[name] === undefined) target[name] = value
      else if (typeof value === 'object') {
        if (target[name] === undefined) target[name] = {}

        merge(target[name], value, path)
      } else if (target[name] !== value) throw new Error(`Merge conflict at ${string(path)}`)

      path.pop()
    }
  } else throw new TypeError(`Merge arguments must be object type at ${string(path)}`)

  return target
}

const string = (path) => '/' + path.join('/')

exports.merge = merge
