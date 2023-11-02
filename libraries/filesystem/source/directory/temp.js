'use strict'

const { mkdtemp } = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const temp = async (prefix = Math.random().toString(36).slice(2)) =>
  mkdtemp(join(tmpdir(), prefix))

exports.temp = temp
