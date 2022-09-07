'use strict'

const { context } = require('@toa.io/libraries/generic')

const storage = context('sampling')

exports.storage = storage
