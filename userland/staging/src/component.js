'use strict'

const boot = require('@toa.io/boot')
const { stage } = require('./stage')

/** @type {toa.userland.staging.Component} */
const component = async (path) => {
  const manifest = await boot.manifest(path)
  const component = await boot.component(manifest)

  await component.connect()

  stage.components.push(component)

  return component
}

exports.component = component
