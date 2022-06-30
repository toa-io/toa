const { Given } = require('@cucumber/cucumber')

Given('my working directory is {path}', function (path) {
  process.chdir(path)
  this.cwd = path
})
