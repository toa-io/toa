/** The component the extension ships to keep the runs it continues. */
export const NAMESPACE = 'continuity'
export const COMPONENT = 'journal'

/**
 * The least a run may be kept for, in seconds. What `once` holds a call for at the least, and for
 * the same reason: the broker alone repeats a message for about ten minutes.
 */
export const WINDOW = 600
