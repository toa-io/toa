import { context as find } from '../../util/find.js'
import { deployment } from '@toa.io/operations'

const { Factory } = deployment

export const prepare = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment, { mono: argv.mono === true })
  const operator = await factory.operator()
  const target = await operator.prepare(argv.target)

  console.log(target)
}
