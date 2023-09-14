'use strict'

const boot = require('@toa.io/boot')
const { state } = require('./state')

/** @type {toa.stage.Component} */
const component = async (path, options) => {
  options = Object.assign({}, DEFAULTS, options)

  const manifest = await boot.manifest(path, options)
  const component = await boot.component(manifest)

  await component.connect()

  state.components.push(component)

  return component
}

const binding = require.resolve('./binding')
const DEFAULTS = { bindings: [binding] }

exports.component = component
