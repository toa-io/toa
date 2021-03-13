'use strict'

const path = require('path')
const glob = require('glob-promise')

const { concat, console } = require('@kookaburra/gears')

function validation (dir) {
  const checks = glob.sync(path.resolve(dir, './*.js')).map(require).map(o => o.checks)

  async function validate (object, manifest, ...rest) {
    if (!manifest) { manifest = object }

    for (const group of checks) {
      for (const check of group) {
        if (await check(object, manifest, ...rest) === false) {
          const failure = typeof check.message === 'function' ? check.message(object, manifest, ...rest) : check.message
          const message = `Component '${concat(manifest.domain, '.')}${manifest.name}': ${failure}`

          if (check.fatal) { throw new Error(message) }

          console.warn(message)
        }

        if (check.break === true || check.break?.(object)) { break }
      }
    }
  }

  return validate
}

exports.validation = validation
