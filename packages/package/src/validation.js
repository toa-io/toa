'use strict'

const path = require('path')
const glob = require('glob-promise')

const { concat, console } = require('@kookaburra/gears')

function validation (dir) {
  const checks = glob.sync(path.resolve(__dirname, `./validation/${dir}/*.js`)).map(require).map(o => o.checks)

  return manifest => {
    for (const group of checks) {
      for (const check of group) {
        if (check(manifest) === false) {
          const message = `Component '${concat(manifest.domain, '.')}${manifest.name}' ${check.message}`

          if (check.fatal) { throw new Error(message) }

          console.warn(message)

          if (check.break) { break }
        }
      }
    }
  }
}

function dupes (a, b, message) {
  if (!b) return

  Object.keys(a).forEach(key => {
    if (key === 'name') return

    if (key in b) {
      if (a[key] !== b[key]) {
        throw new Error(`${message} for '${a.name}' ` +
        `conflicts on key '${key}' (${a[key]}, ${b[key]})`)
      }
    }
  })
}

exports.manifest = validation('manifest')
exports.operation = validation('operation')
exports.dupes = dupes
