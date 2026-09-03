import * as boot from './index.js'

export async function rc (manifest, context) {
  return boot.bridge.rc(manifest.bridge, manifest.path, context)
}
