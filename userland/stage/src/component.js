import * as boot from '@toa.io/boot'
import { state } from './state.js'

/** @type {toa.stage.Component} */
const component = async (path, options) => {
  const manifest = await boot.manifest(path, options)
  const component = await boot.component(manifest)

  await component.connect()

  state.components.push(component)

  return component
}

export { component }
