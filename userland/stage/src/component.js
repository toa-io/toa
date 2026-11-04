import * as boot from '@toa.io/boot'
import { state } from './state.js'

/** @type {toa.stage.Component} */
export const component = async (path, options) => {
  const manifest = await boot.manifest(path, options)
  const component = await boot.component(manifest)

  // held before it connects: one that is still connecting when the stage stops is stopped too
  state.components.push(component)

  await component.connect()

  return component
}
