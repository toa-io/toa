/**
 * A line of a `.env` file that `dotenv` reads back as the value it was written with. Unquoted, a
 * value ends at a `#` — the start of a comment — so one that holds a `#`, a line break or what
 * quoting would take away is quoted, by the first of `'`, `` ` `` and `"` it does not hold. A
 * value that holds all three and a `#` is JSON — the configuration of a context, whose text says
 * anything — and its `#`, which JSON has only inside a string, is written as `#`, which
 * parses as the same character.
 *
 * @param {string} name
 * @param {string | undefined} value
 * @returns {string}
 */
export function line(name, value = '') {
  if (!UNSAFE.test(value)) return `${name}=${value}`

  for (const quote of QUOTES)
    if (!value.includes(quote)) return `${name}=${quote}${value}${quote}`

  if (!value.includes('\n') && json(value))
    return `${name}=${value.replaceAll('#', '\\u0023')}`

  throw new Error(
    `'${name}' holds what a .env file cannot: a '#' or a line break, and every quote`
  )
}

/** @param {string} value */
function json(value) {
  try {
    JSON.parse(value)

    return true
  } catch {
    return false
  }
}

// a `#`, a line break, or a quote or a space at either end, which `dotenv` would read away
const UNSAFE = /[#\r\n]|^\s|\s$|^['"`]|['"`]$/
const QUOTES = ["'", '`', '"']
