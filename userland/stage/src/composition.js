import * as boot from '@toa.io/boot'
import { state } from './state.js'

/** @type {toa.stage.Composition} */
export const composition = async (paths, options) => {
  const composition = await boot.composition(paths, options)

  // held before it connects: one that is still connecting when the stage stops is stopped too
  state.compositions.push(composition)

  await composition.connect()
}
