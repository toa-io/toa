import { component } from '@toa.io/norm'
import { yaml as jsyaml } from '@toa.io/generic'

import { components as find } from '../../util/find.js'

export const manifest = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  const declaration = await component(path)

  if (argv.error !== true) {
    // js-yaml writes plain objects only, and a manifest carries a Locator
    const plain = JSON.parse(JSON.stringify(declaration))

    const result =
      argv.output === 'json'
        ? JSON.stringify(plain, null, 2)
        : jsyaml.dump(plain, { noRefs: true, lineWidth: -1 })

    console.log(result)
  }
}
