export const create = (Factory) => {
  const factory = new Factory()

  return factory.create()
}
