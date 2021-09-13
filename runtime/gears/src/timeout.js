'use strict'

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

exports.timeout = timeout
