'use strict'

const generic = require('@toa.io/libraries/generic')

/** @type {toa.generic.context.Storage} */
const context = generic.context('sampling')

exports.context = context
