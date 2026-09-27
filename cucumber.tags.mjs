/*
 * What a change has to pass before it is pushed. A scenario is left out of it only where
 * something other than the code decides whether it passes: a host on the internet, an image
 * it pulls and boots, a lifetime it has to sit through, or a `helm` on the PATH rendering a
 * chart that does not change.
 */
const REQUIRED =
  'not @skip and not @manual and not @network and not @containers and not @timing' +
  ' and not @helm and not @cli and not @deployment'

/*
 * And what runs nightly, where a failure costs a report rather than a merge. `@manual` is
 * not in it either: what decides those is not the code, and what they need is not there.
 */
const NIGHTLY = 'not @skip and not @manual'

/*
 * And what is run by hand, where what decides the outcome is something a person put in place:
 * an account that holds a secret, a cluster `kubectl` points at. `--tags` on the command line
 * is conjoined with the selected set rather than replacing it, so a set that excludes
 * `@manual` cannot be talked into running one — asking for these is asking for this set.
 */
const MANUAL = '@manual and not @skip'

const SETS = { nightly: NIGHTLY, manual: MANUAL }

/** Which set a run selects. Every suite reads this, so they cannot disagree. */
export const TAGS = SETS[process.env.TOA_FEATURES ?? ''] ?? REQUIRED
