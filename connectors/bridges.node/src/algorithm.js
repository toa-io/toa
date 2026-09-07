/**
 * The one algorithm a loaded module exports, and the syntax it is written in. What the
 * algorithm is — its type and scope — was read from the source before anything ran; here the
 * module is loaded to run it, so only which export to call and how remains.
 *
 * @param {Object} module
 * @returns {{ name: string, func: Function, syntax: 'function' | 'class' | 'factory' }}
 */
export function algorithm(module) {
  const entry = find(module)

  if (entry === null) throw new Error('Module exports no algorithm')

  const [name, func] = entry
  const syntax = FACTORY.test(name) ? 'factory' : isClass(func) ? 'class' : 'function'

  return { name, func, syntax }
}

/**
 * A module namespace enumerates its exports in sorted order rather than the order
 * they were written, so which one is meant has to be unambiguous.
 *
 * @param {Object} module
 * @returns {[string, Function] | null}
 */
function find(module) {
  const functions = Object.entries(module).filter(
    ([key, value]) => typeof value === 'function' && key !== '__esModule'
  )

  if (functions.length === 0) return null
  if (functions.length === 1) {
    const [name, func] = functions[0]

    // `export default function transition` says its name in the function itself
    return name === 'default' ? [func.name, func] : functions[0]
  }

  const named = functions.filter(([key]) => key !== 'default')

  if (named.length === 1) return named[0]

  throw new Error(
    'A module must export one algorithm, and this one exports ' +
      named.map(([key]) => `'${key}'`).join(', ')
  )
}

function isClass(func) {
  return /^class[\s{]/.test(Function.prototype.toString.call(func))
}

const FACTORY =
  /^(?:Objects?|Changeset)?(?:Transition|Observation|Assignment|Computation|Effect)Factory$/
