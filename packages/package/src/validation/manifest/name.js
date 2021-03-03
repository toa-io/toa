'use strict'

const { defined, string, match } = require('../commons')

exports.checks = [defined('name'), string('name'), match('name')]
