enum Kind { one, two }

export async function transition (input: string, object: string): Promise<{ kind: Kind }> {
  return { kind: input === object ? Kind.one : Kind.two }
}
