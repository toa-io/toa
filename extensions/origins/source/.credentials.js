'use strict'

/**
 * @param {string} reference
 */
function check (reference) {
  if (typeof reference !== 'string') return // aspect properties object

  let url

  try {
    url = new URL(reference)
  } catch {
    return
  }

  if (url.username !== '' || url.password !== '') throw new Error('Origins must not contain credentials. Please use environment secrets instead.')
}

exports.check = check
