'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.samples.Declaration} declaration
 * @returns {toa.samples.Sample}
 */
const translate = (declaration) => {
  schema.validate(declaration)

  const { title, input, output } = declaration
  const request = { input }
  const reply = { output }

  return { title, request, reply }
}

exports.translate = translate
