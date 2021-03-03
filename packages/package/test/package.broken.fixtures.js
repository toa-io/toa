const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const noDomain = path.resolve(root, 'broken/no-domain')
const operationsNotArray = path.resolve(root, 'broken/operations-not-array')
const conflictingDeclaration = path.resolve(root, 'broken/conflicting-declaration')

exports.paths = { noDomain, operationsNotArray, conflictingDeclaration }
