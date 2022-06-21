'use strict'

const { rm } = require('node:fs/promises')

/**
 * @param path {string}
 * @return {Promise<void>}
 */
const remove = async (path) => rm(path, RECURSIVE)

const RECURSIVE = { recursive: true }

exports.remove = remove
