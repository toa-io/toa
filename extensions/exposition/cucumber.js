module.exports = {
  default: {
    requireModule: ['ts-node/register/transpile-only'],
    require: ['./features/**/*.ts'],
    failFast: true
  }
}
