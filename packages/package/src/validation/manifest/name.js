'use strict'

const defined = (manifest) => manifest.name !== undefined
defined.message = 'manifest property \'name\' must be defined'
defined.fatal = true

const string = (manifest) => typeof manifest.name === 'string'
string.message = 'manifest property \'name\' must be a string'
string.fatal = true

const regex = /^[a-z]+([-a-z0-9]*[a-z0-9]+)?$/
const match = (manifest) => manifest.name.match(regex) !== null
match.message = `manifest property 'name' value must match ${regex.toString()}`
match.fatal = true

exports.checks = [defined, string, match]
