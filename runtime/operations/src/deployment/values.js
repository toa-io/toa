'use strict'

const values = (context, dependencies) => {
  return Object.fromEntries(dependencies.map(({ chart, values }) => [chart.alias || chart.name, values]))
}

exports.values = values
