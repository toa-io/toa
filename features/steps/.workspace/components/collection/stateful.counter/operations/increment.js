// held in this process's memory, and nowhere else; counted by key, so scenarios keep apart
const counts = new Map()

export async function computation(key, context) {
  const count = (counts.get(key) ?? 0) + 1

  counts.set(key, count)

  return { instance: context.instance, count }
}
