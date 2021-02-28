const path = require('path')
const glob = require('glob-promise')

const { console } = require('@kookaburra/gears')

const checks = glob.sync(path.resolve(__dirname, './checks/*.js')).map(require).map(o => o.checks).flat()

function check (manifest) {
  for (const check of checks) {
    if (!check(manifest)) {
      const component = `${manifest.domain ? `${manifest.domain}.` : ''}${manifest.name}`
      const message = `Component '${component}' manifest ${check.message}`

      if (check.fatal) { throw new Error(message) }

      console.warn(message)
    }
  }
}

exports.check = check
