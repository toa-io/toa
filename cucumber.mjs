import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// tsx compiles the step definitions; the steps' own tsconfig is what tells esbuild
// they use legacy decorators, which cucumber-tsflow requires
process.env.TSX_TSCONFIG_PATH ??= join(here, 'extensions/exposition/features/steps/tsconfig.json')

const common = {
  requireModule: ['tsx/cjs'],
  failFast: true
}

export default {
  default: {
    ...common,
    require: ['./features/**/*.js', './features/**/*.ts']
  },
  exposition: {
    ...common,
    paths: ['extensions/exposition/features'],
    require: ['extensions/exposition/features/**/*.ts']
  }
}
