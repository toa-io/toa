'use strict'

const { defined, match } = require('../commons')

const def = defined('domain', false)
def.message = 'manifest missing \'domain\' property. If this is intended use null as domain value.'
def.fatal = false
def.break = true

const string = (manifest) => manifest.domain === null || typeof manifest.domain === 'string'
string.message = 'manifest \'domain\' property must be a string'
string.fatal = true

const matches = match('domain')
const format = (manifest) => manifest.domain === null || matches(manifest)
format.message = matches.message
format.fatal = true

exports.checks = [def, string, format]
