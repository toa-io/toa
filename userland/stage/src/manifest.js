import * as boot from '@toa.io/boot'

/**
 * @type {toa.stage.Manifest}
 */
export const manifest = async (path) => {
  return boot.manifest(path)
}
