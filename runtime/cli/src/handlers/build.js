import { context as find } from '../util/find.js'
import { deployment } from '@toa.io/operations'

const { Factory } = deployment

const build = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment, { mono: argv.mono === true })
  const registry = factory.registry()

  await registry.build()
}

export { build }
