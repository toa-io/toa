'use strict'

const response = (output, error, exception, res) => {
  if (exception) internal(exception, res)
  else if (error) bad(error, res)
  else ok(output, res)
}

const internal = (exception, res) => {
  res.status(500)

  if (process.env.KOO_ENV === 'dev') res.json(exception)
}

const bad = (error, res) => {
  res.status(400)
  res.json({ error })
}

const ok = (output, res) => {
  res.json({ output })
}

exports.response = response
