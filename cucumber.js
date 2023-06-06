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
  norm: {
    ...common,
    paths: ['runtime/norm/features'],
    require: ['runtime/norm/features/**/*.js']
  },
  exposition: {
    ...common,
    paths: ['extensions/exposition/features'],
    require: ['extensions/exposition/features/**/*.ts']
  }
}
