'use strict'

const { Package } = require('@kookaburra/package')
const { Runtime } = require('@kookaburra/runtime')

const { operation } = require('./operation')
const { invocation } = require('./invocation')

async function runtime (dir) {
  const component = await Package.load(dir)
  const invocations = component.algorithms.map(operation).map(invocation)

  return new Runtime(invocations)
}

exports.runtime = runtime
