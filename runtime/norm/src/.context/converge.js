/**
 * A context that declares convergence converges every component that stores anything, and no
 * manifest says so. An extension is loaded, deployed and hooked because a component's
 * `extensions` names it, so this is where they come to name it.
 *
 * **Including the components an extension ships**, which is why this runs where they are
 * known rather than over what the context declares: an application deployed as two regions
 * whose identity does not converge is one where a user registered in the first does not
 * exist in the second.
 *
 * There is nothing per-component to normalize and nothing to opt out of: a region is
 * infrastructure, and what a component stores is not its business. What is genuinely owned by
 * one region — which delayed calls this one makes — is said where that is decided, in
 * `cadence.regions`, and not by holding the records back.
 *
 * @param {toa.norm.Context} context
 * @param {toa.norm.Component[]} components every component the context deploys
 * @returns {void}
 */
export const converge = (context, components) => {
  if (context.annotations?.[REFERENCE] === undefined) return

  for (const component of components) {
    if (component.entity === undefined) continue

    component.extensions ??= {}
    component.extensions[REFERENCE] ??= null
  }
}

const REFERENCE = '@toa.io/extensions.convergence'
