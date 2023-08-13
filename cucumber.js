const common = { publishQuiet: true, failFast: true }

module.exports = {
  default: {
    ...common,
    require: ['./features/**/*.js']
  }
}
