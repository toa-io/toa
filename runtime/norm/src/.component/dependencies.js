import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'

// import.meta.resolve takes no paths, and a storage is resolved against the
// component that names it
const require = createRequire(import.meta.url)

/**
 * @param {toa.norm.Component} component
 */
const dependencies = (component) => {
  if ('entity' in component) component.entity.storage = resolve(component.path, component.entity.storage)
}

function resolve (root, reference) {
  const paths = [root, import.meta.dirname]
  const options = { paths }

  let path

  try { // as package
    const packageJsonRef = join(reference, 'package.json')

    path = require.resolve(packageJsonRef, options)
  } catch { // as directory
    path = require.resolve(reference, options)
  }

  return dirname(path)
}

export { dependencies }
