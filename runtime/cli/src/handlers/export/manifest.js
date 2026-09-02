import jsonpath from 'jsonpath'
import { component } from '@toa.io/norm'
import * as jsyaml from 'js-yaml'

import { components as find } from '../../util/find.js'

const print = async (argv) => {
  const path = find(argv.path)

  if (path === undefined) throw new Error(`No component found in ${argv.path}`)

  let manifest = await component(path)

  if (argv.jsonpath !== undefined)
    manifest = jsonpath.value(manifest, argv.jsonpath)

  if (argv.error !== true) {
    // js-yaml writes plain objects only, and a manifest carries a Locator
    const plain = JSON.parse(JSON.stringify(manifest))

    const result = argv.output === 'json'
      ? JSON.stringify(plain, null, 2)
      : jsyaml.dump(plain, { noRefs: true, lineWidth: -1 })

    console.log(result)
  }
}

export { print as manifest }
