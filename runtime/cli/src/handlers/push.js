import { deployment } from '@toa.io/operations'
import { context as find } from '../util/find.js'

const { Factory } = deployment

const push = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path)
  const registry = factory.registry()

  await registry.push()
}

export { push }
