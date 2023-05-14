'use strict'

const aspect = (name) =>
  /**
   * @param {toa.samples.Operation & Record<string, any>} declaration
   */
    (declaration) => {
    const value = declaration[name]

    delete declaration[name]

    if (declaration.extensions === undefined) declaration.extensions = {}

    if (name in declaration.extensions) throw new Error(`${name} aspect sample is ambiguous`)

    /** @type {toa.sampling.request.extensions.Call} */
    const call = {
      result: value,
      permanent: true
    }

    declaration.extensions[name] = [call]

  }

exports.aspect = aspect
