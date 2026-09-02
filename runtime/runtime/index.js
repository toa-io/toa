'use strict'

const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const { version } = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))

exports.version = version
