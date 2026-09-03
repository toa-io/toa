let instances = {}

// the promise is what is remembered, so two components cannot each make a factory
export const factory = async (binding) => {
  instances[binding] ??= import(binding).then(({ Factory }) => new Factory())

  return await instances[binding]
}

// for testing purposes
export const reset = () => (instances = {})
