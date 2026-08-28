module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['./features/**/*.ts'],
    failFast: true
  }
}
