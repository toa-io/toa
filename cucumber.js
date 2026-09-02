const { join } = require('node:path')

// tsx compiles the step definitions; the steps' own tsconfig is what tells esbuild
// they use legacy decorators, which cucumber-tsflow requires
process.env.TSX_TSCONFIG_PATH ??= join(__dirname, 'extensions/exposition/features/steps/tsconfig.json')

const common = {
  requireModule: ['tsx/cjs'],
  failFast: true
}

module.exports = {
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
