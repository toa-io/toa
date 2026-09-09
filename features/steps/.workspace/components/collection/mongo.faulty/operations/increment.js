export const transition = (_, object) => {
  // what a receiver's operation does when something it depends on is away
  if (object.failing) throw new Error('mongo.faulty is failing')

  object.count++
}
