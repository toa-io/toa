const common = { publishQuiet: true }

module.exports = {
  default: {
    ...common,
    paths: ['features'],
    require: ['features/**/*.js']
  },
  schema: {
    ...common,
    paths: ['libraries/schema/features'],
    require: ['libraries/schema/features/**/*.js']
  }
}
