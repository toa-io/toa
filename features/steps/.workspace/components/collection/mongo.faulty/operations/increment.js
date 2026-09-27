export const transition = (_, entry) => {
  // what a receiver's operation does when something it depends on is away
  if (entry.failing) throw new Error('mongo.faulty is failing')

  entry.count++
}
