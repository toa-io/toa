import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// tsx compiles the step definitions; the steps' own tsconfig is what tells esbuild
// they use legacy decorators, which cucumber-tsflow requires
process.env.TSX_TSCONFIG_PATH ??= join(here, 'features/steps/tsconfig.json')

export default {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['./features/**/*.ts'],
    failFast: true
  }
}
