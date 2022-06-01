'use strict'

const { id } = require('../handlers/id')

exports.command = 'id'
exports.desc = 'Generate new ID'
exports.handler = id
