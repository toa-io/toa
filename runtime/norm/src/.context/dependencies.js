'use strict'

const { connectors, extensions, resolve } = require('./.dependencies')

const dependencies = async (context) => {
  const references = { ...connectors(context), ...(await extensions(context)) }

  return resolve(references, context.annotations)
}

exports.dependencies = dependencies
