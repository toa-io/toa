'use strict'

const { resolve } = require('node:path')
const { convolve } = require('@toa.io/generic')
const { directory: { glob } } = require('@toa.io/filesystem')
const { load } = require('@toa.io/yaml')

const { component } = require('./component')

const {
  dependencies,
  normalize,
  complete,
  dereference,
  expand,
  validate
} = require('./.context')

const context = async (root, environment = process.env.TOA_ENV) => {
  const path = resolve(root, CONTEXT)
  const context = /** @type {toa.norm.Context} */ await load(path)
  const pattern = resolve(root, context.packages)

  context.environment = environment

  convolve(context, environment)
  expand(context)
  normalize(context)

  validate(context)

  const paths = await glob(pattern)

  context.components = await Promise.all(paths.map(component))
  context.dependencies = dependencies(context)

  dereference(context)
  complete(context)

  return context
}

const CONTEXT = 'context.toa.yaml'

exports.context = context
