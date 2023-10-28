'use strict'

const generic = require('@toa.io/generic')

const id = Symbol('sampling')
const context = generic.context(id)

exports.context = context
