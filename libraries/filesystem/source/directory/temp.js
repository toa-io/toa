'use strict'

const { mkdtemp } = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const temp = async (prefix = '') => mkdtemp(join(tmpdir(), prefix))

exports.temp = temp
