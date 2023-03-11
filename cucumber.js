const common = { publishQuiet: true, failFast: true }

module.exports = {
  default: {
    ...common,
    require: ['./features/**/*.js']
  },
  schema: {
    ...common,
    paths: ['libraries/schema/features'],
    require: ['libraries/schema/features/**/*.js']
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
