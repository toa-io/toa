'use strict'

const { table } = require('./.gherkin/table')

const KEYWORDS = ['Given', 'When', 'Then', 'Before', 'BeforeAll', 'After', 'AfterAll']

exports.steps = {}

const calls = {}

const clear = () => {
  for (const KEYWORD of KEYWORDS) calls[KEYWORD] = []
}

clear()

for (const KEYWORD of KEYWORDS) {
  exports[KEYWORD] = (...args) => {
    calls[KEYWORD].push(args)
  }

  exports.steps[KEYWORD] = (index) => {
    const step = typeof index === 'number' ? calls[KEYWORD][index] : calls[KEYWORD].find((call) => call[0] === index)?.[1]

    if (step === undefined) throw new Error(`Step '${KEYWORD} ${index}' is not defined`)

    return step
  }
}

exports.table = table
exports.clear = clear
