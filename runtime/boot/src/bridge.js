export async function algorithm (bridge, path, endpoint, context) {
  const factory = await resolve(bridge)
  const algorithm = await factory.algorithm(path, endpoint, context)

  algorithm.depends(context)

  return algorithm
}

export const event = async (bridge, path, label, context) =>
  (await resolve(bridge)).event(path, label, context)

export const receiver = async (bridge, path, label) =>
  (await resolve(bridge)).receiver(path, label)

export const guard = async (bridge, path, label, context) =>
  (await resolve(bridge)).guard(path, label, context)

export async function rc (bridge, path, context) {
  const factory = await resolve(bridge)

  if (factory.rc === undefined)
    return

  return factory.rc(path, context)
}

const factories = {}

// the promise is what is remembered, so two boots cannot each make a factory
const resolve = async (bridge) => {
  factories[bridge] ??= import(bridge).then(({ Factory }) => new Factory())

  return await factories[bridge]
}
