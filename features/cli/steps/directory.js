const { Given } = require('@cucumber/cucumber')

Given('my working directory is {path}', function (path) {
  this.cwd = path
})
