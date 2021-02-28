const path = require('path')

const root = path.dirname(require.resolve('@kookaburra/dummies'))

const noDomain = path.resolve(root, 'broken/no-domain')
const operationsNotArray = path.resolve(root, 'broken/operations-not-array')
const multipleDeclaration = path.resolve(root, 'broken/multiple-declaration')
const conflictingDeclaration = path.resolve(root, 'broken/conflicting-declaration')

exports.paths = { noDomain, operationsNotArray, multipleDeclaration, conflictingDeclaration }
