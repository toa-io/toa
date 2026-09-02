import * as boot from '@toa.io/boot'
import { state } from './state.js'

/** @type {toa.stage.Composition} */
const composition = async (paths, options) => {
  const composition = await boot.composition(paths, options)

  await composition.connect()

  state.compositions.push(composition)
}

export { composition }
