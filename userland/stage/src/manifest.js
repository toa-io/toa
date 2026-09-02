import * as boot from '@toa.io/boot'

/**
 * @type {toa.stage.Manifest}
 */
const manifest = async (path) => {
  return boot.manifest(path)
}

export { manifest }
