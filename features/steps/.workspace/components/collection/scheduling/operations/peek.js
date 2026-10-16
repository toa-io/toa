export async function computation(input, context) {
  // the call it schedules is harmless; storing the schedule is what writes
  return await context.schedule('default.scheduling.marks', null, input.schedule)
}
