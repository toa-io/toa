'use strict'

const { defined, string, match } = require('../commons')

const def = defined('domain', false)
def.message = 'manifest missing \'domain\' property. If this is intended use null as domain value.'
def.break = true

exports.checks = [def, string('domain'), match('domain')]
