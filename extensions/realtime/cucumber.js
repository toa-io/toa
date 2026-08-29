module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register/transpile-only'],
    require: ['./features/**/*.ts'],
    failFast: true
  }
}
