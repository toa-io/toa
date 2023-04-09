'use strict'

const { glob } = require('./glob')
const { lines } = require('./lines')
const { read } = require('./read')
const { write } = require('./write')
const { exists } = require('./exists')

exports.glob = glob
exports.lines = lines
exports.read = read
exports.write = write
exports.exists = exists
