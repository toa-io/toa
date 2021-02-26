const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const noDomain = {
  path: path.resolve(root, 'broken/no-domain')
}

exports.noDomain = noDomain
