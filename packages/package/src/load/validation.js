'use strict'

const path = require('path')
const glob = require('glob-promise')

const { console } = require('@kookaburra/gears')

function validation (dir) {
  const checks = glob.sync(path.resolve(__dirname, `./validation/${dir}/*.js`)).map(require).map(o => o.checks).flat()

  return manifest => {
    for (const check of checks) {
      if (check(manifest) === false) {
        const component = `${manifest.domain ? `${manifest.domain}.` : ''}${manifest.name}`
        const message = `Component '${component}' manifest ${check.message}`

        if (check.fatal) { throw new Error(message) }

        console.warn(message)
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
