const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const noDomain = path.resolve(root, 'broken/no-domain')
const operationsNotArray = path.resolve(root, 'broken/operations-not-array')

exports.paths = { noDomain, operationsNotArray }
