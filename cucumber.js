const common = {
  requireModule: ['ts-node/register'],
  publishQuiet: true,
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
