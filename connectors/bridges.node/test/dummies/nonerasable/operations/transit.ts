enum Kind {
  one,
  two
}

export async function transition(input: string, entry: string): Promise<{ kind: Kind }> {
  return { kind: input === entry ? Kind.one : Kind.two }
}
