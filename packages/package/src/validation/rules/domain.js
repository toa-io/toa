'use strict'

const defined = manifest => manifest.domain !== undefined
defined.message = 'manifest missing \'domain\' property. If this is intended use null as domain value.'
defined.break = manifest => !defined(manifest)

const string = manifest => manifest.domain === null || typeof manifest.domain === 'string'
string.message = 'manifest \'domain\' property must be a string'
string.fatal = true
string.break = manifest => manifest.domain === null

const regex = /^[a-z]+([-a-z0-9]*[a-z0-9]+)?$/
const match = manifest => manifest.domain.match(regex) !== null
match.message = `manifest 'domain' property must match ${regex.toString()}`
match.fatal = true

exports.checks = [defined, string, match]
