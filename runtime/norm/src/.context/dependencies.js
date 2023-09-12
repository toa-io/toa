'use strict'

const { connectors, extensions, resolve } = require('./.dependencies')

const dependencies = async (context) => {
  const { extensions: e, components } = await extensions(context)
  const c = connectors(context, components)
  const references = { ...c, ...e }

  return resolve(references, context.annotations)
}

exports.dependencies = dependencies
