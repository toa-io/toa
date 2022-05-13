'use strict'

const { promisify } = require('node:util')
const { exec: execSync } = require('node:child_process')

const exec = promisify(execSync)

/**
 * @param source {string}
 * @param target {string}
 * @returns {void}
 */
const copy = async (source, target) => {
  await exec(`cp -r "${source}" "${target}"`)
}

exports.copy = copy
