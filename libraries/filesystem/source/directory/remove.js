'use strict'

const { rm } = require('node:fs/promises')

const remove = async (path) => rm(path, RECURSIVE)

const RECURSIVE = { recursive: true }

exports.remove = remove
