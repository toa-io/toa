'use strict'

const gherkin = {
  ...require('./steps'),
  table: require('./table').table
}

module.exports = gherkin
