/**
 * Loads a command's handler, and says what to install where the handler needs a package the
 * CLI does not carry: the runtime for what runs a composition, the deployment library for what
 * deploys one. Each is a peer of the CLI, and an install has the ones it is for.
 *
 * @param {string} command what the user typed, for the message
 * @param {() => Promise<object>} load the handler module
 * @param {[string, string]} requirement the module whose absence is detected, and the package to install
 * @returns {Promise<object>}
 */
export async function needs(command, load, requirement) {
  const [module, install] = requirement

  try {
    return await load()
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes(`'${module}'`))
      throw new Error(`\`toa ${command}\` needs ${install}, which is not installed`, {
        cause: error
      })

    throw error
  }
}

/** What runs a composition: `@toa.io/boot` comes with the runtime. */
export const RUNTIME = ['@toa.io/boot', '@toa.io/runtime']

/** What deploys one. */
export const OPERATIONS = ['@toa.io/operations', '@toa.io/operations']

/** What generates a key, which a container never does: the deployment library carries it. */
export const PASETO = ['paseto', '@toa.io/operations']

/** What selects a part of a manifest, likewise. */
export const JSONPATH = ['jsonpath', '@toa.io/operations']
