export function computation(input, context) {
  const marks = context.state.marks ?? []
  const ats = marks.map((mark) => mark.at)

  return {
    count: marks.length,
    enough: marks.length >= (input?.least ?? 0),
    // each call is for the second after the one before it
    consecutive: ats.every((at, index) => index === 0 || at === ats[index - 1] + 1000),
    notes: [...new Set(marks.map((mark) => mark.note))],
    repeated: new Set(ats).size !== ats.length,
    // a call that arrived a second or more after the moment it was for
    late: marks.some((mark) => mark.received - mark.at >= 1000)
  }
}
