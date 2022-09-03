'use strict'

const { readFile } = require('node:fs/promises')
const { readFileSync } = require('node:fs')

const read = async (file) => await readFile(file, OPTIONS)

read.sync = (file) => readFileSync(file, OPTIONS)

const OPTIONS = { encoding: 'utf8' }

exports.read = read
