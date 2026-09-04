import { entries } from './entries.js'

// noinspection FunctionWithMoreThanThreeNegationsJS
export const merge = (target, source, options = {}, path = []) => {
  if (target === undefined) target = {}
  if (source === undefined) source = {}

  if (typeof target !== typeof source) {
    if (options.overwrite) return source
    else throw new TypeError(`generic/merge: arguments must be of the same type at ${string(path)}`)
  }

  if (source instanceof Array && target instanceof Array) {
    if (options.overwrite === true) {
      target.length = 0
      target.push(...source)
    } else if (options.ignore !== true)
      /*
       * What both sides say is said once. These are lists of what a thing is made of —
       * the properties a record requires, the bindings a component speaks, the errors an
       * operation returns — and a prototype naming what a component already named is the
       * same requirement twice, not two of them.
       *
       * Objects are compared by identity, so lists of them concatenate as before: two
       * that look alike are still two.
       */
      target.push(...source.filter((value) => !target.includes(value)))
  } else if (typeof source === 'object' && typeof target === 'object') {
    for (const [name, value] of entries(source)) {
      path.push(name)

      if (source[name] !== undefined) {
        if (target[name] === undefined) target[name] = value
        else if (typeof value === 'object' && value !== null) {
          if (target[name] === undefined) target[name] = {}

          target[name] = merge(target[name], value, options, path)
        } else if (target[name] !== value) {
          if (options.overwrite === true) target[name] = value
          else if (options.ignore !== true) {
            throw new Error(`generic/merge: conflict at ${string(path)} ('${value}', '${target[name]}')`)
          }
        }
      }

      path.pop()
    }
  } else throw new TypeError(`generic/merge: arguments must be objects or arrays at ${string(path)}`)

  return target
}

export const overwrite = (target, source) => merge(target, source, { overwrite: true })
export const add = (target, source) => merge(target, source, { ignore: true })

const string = (path) => '/' + path.join('/')
