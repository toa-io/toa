'use strict'

const { acronyms } = require('@toa.io/generic')

/** @type {toa.tomato.Keyword[]} */
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

  exports.steps[KEYWORD] = (index = 0) => {
    const step = typeof index === 'number'
      ? calls[KEYWORD][index].slice(-1)[0]
      : calls[KEYWORD].find((call) => call[0] === index)?.[1]

    if (step === undefined) throw new Error(`Step '${KEYWORD} ${index}' is not defined`)

    return step
  }

  const acronym = acronyms.camelcase(KEYWORD)
  exports.steps[acronym] = exports.steps[KEYWORD]
}

exports.clear = clear
