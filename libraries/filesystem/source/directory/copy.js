'use strict'

const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)

const copy = async (source, target) => {
  await exec(`cp -r "${source}/" "${target}"`)
}

exports.copy = copy
