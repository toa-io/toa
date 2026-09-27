export const transition = (input, entry) => {
  entry.count += input.amount

  return entry
}
