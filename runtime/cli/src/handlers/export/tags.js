import { context as find } from '../../util/find.js'
import { deployment } from '@toa.io/operations'

const { Factory } = deployment

/**
 * @param {{ path: string, target: string, environment: string }} argv
 * @returns {Promise<void>}
 */
export const tags = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment, { mono: argv.mono === true })
  const operator = await factory.operator()
  const tags = operator.tags()

  for (const tag of tags)
    console.log(tag)
}
