'use strict'

const path = require('path')
const glob = require('glob-promise')

const { concat, console } = require('@kookaburra/gears')

function validation (dir) {
  const checks = glob.sync(path.resolve(dir, './*.js')).map(require).map(o => o.checks)

  async function validate (object, manifest) {
    if (!manifest) { manifest = object }

    for (const group of checks) {
      for (const check of group) {
        if (await check(object, manifest) === false) {
          const message = `Component ${concat(manifest.domain, '.')}${manifest.name} ${check.message}`

          if (check.fatal) { throw new Error(check.message) }

          console.warn(message)
        }

        if (check.break === true || check.break?.(object)) { break }
      }
    }
  }

  return validate
}

exports.validation = validation
