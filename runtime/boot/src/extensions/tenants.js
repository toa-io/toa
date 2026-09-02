import { resolve } from './resolve.js'

/**
 * @param {toa.norm.Component} manifest
 * @returns {toa.core.Connector[]}
 */
const tenants = async (manifest) => {
  const tenants = []

  if (manifest.extensions === undefined) return tenants

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const factory = await resolve(name, manifest.path)

    if (factory.tenant === undefined) continue

    const tenant = await factory.tenant(manifest.locator, declaration, manifest)

    tenants.push(tenant)
  }

  return tenants
}

export { tenants }
