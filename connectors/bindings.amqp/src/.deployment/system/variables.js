'use strict'

const { variable, uris: { resolve } } = require('@toa.io/libraries/connectors')

const { PREFIX, SYSTEM } = require('../../constants')
const { Locator } = require('@toa.io/core')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.connectors.URIs} annotation
 * @returns {toa.deployment.dependency.Variables}
 */
const variables = (instances, annotation) => {
  const system = new Locator(SYSTEM)
  const url = resolve(annotation, system)
  const protocol = variable(PREFIX, system, 'protocol', url.protocol)
  const values = [protocol]
  const variables = {}

  if (url.port !== '') {
    const number = Number(url.port)
    const port = variable(PREFIX, system, 'port', number)

    values.push(port)
  }

  for (const instance of instances) variables[instance.locator.label] = values

  return variables
}

exports.variables = variables
