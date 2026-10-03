export function computation(input, context) {
  const marks = context.state.marks ?? []

  return {
    enough: marks.length >= input.least,
    // every recorded call is for the second after the one before it. An occurrence nobody
    // stored leaves a gap, and one made twice a repeat; either is what this is here to catch
    consecutive: marks.every((mark, index) => index === 0 || mark.at === marks[index - 1].at + 1000),
    // a call that arrived a second or more after the moment it was scheduled for
    late: marks.some((mark) => mark.received - mark.at >= 1000),
    foreign: (context.state.foreign ?? []).length
  }
}
