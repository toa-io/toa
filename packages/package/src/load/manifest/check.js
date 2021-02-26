const path = require('path')
const glob = require('glob-promise')

const { console } = require('@kookaburra/gears')

const checks = glob.sync(path.resolve(__dirname, './checks/*.js')).map(require).map(o => o.checks).flat()

function check (manifest) {
  for (const check of checks) {
    if (!check(manifest)) {
      console.warn('Manifest check:', check.description.replace(/%(.+?)%/g, (_, name) => manifest[name]))
    }
  }
}

exports.check = check
