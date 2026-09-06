/*
 * What a change has to pass before it is pushed. A scenario is left out of it only where
 * something other than the code decides whether it passes: a host on the internet, an image
 * it pulls and boots, or a lifetime it has to sit through.
 */
const REQUIRED = 'not @skip and not @manual and not @network and not @containers and not @timing'

/*
 * And what runs nightly, where a failure costs a report rather than a merge. `@manual` is
 * not in it either: those scenarios need a secret someone put in place by hand, and where it
 * is missing they skip rather than fail, so nothing is gained by asking for them.
 */
const NIGHTLY = 'not @skip and not @manual'

/** Which of the two a run selects. Every suite reads this, so they cannot disagree. */
export const TAGS = process.env.TOA_FEATURES === 'nightly' ? NIGHTLY : REQUIRED
