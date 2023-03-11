'use strict'

const find = require('fast-glob')

const glob = async (pattern) => find(pattern, OPTIONS)

const OPTIONS = { onlyDirectories: true, absolute: true }

exports.glob = glob
