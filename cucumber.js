const common = { publishQuiet: true, failFast: true }

module.exports = {
  default: {
    ...common,
    require: ['./features/**/*.js']
  },
  comq: {
    ...common,
    paths: ['libraries/comq/features'],
    require: ['libraries/comq/features/**/*.js']
  },
  norm: {
    ...common,
    paths: ['runtime/norm/features'],
    require: ['runtime/norm/features/**/*.js']
  }
}
