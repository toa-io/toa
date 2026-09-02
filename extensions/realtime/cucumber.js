const { join } = require('node:path')

// tsx compiles the step definitions; the steps' own tsconfig is what tells esbuild
// they use legacy decorators, which cucumber-tsflow requires
process.env.TSX_TSCONFIG_PATH ??= join(__dirname, 'features/steps/tsconfig.json')

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['./features/**/*.ts'],
    failFast: true
  }
}
