'use strict'

const { defined, string, match } = require('../commons')

const def = defined('domain', false)
def.message = 'manifest missing \'domain\' property. If this is intended use null as domain value.'
def.fatal = false
def.break = true

const str = string('domain')
str.message = `manifest ${str.message}`

exports.checks = [def, str, match('domain')]
