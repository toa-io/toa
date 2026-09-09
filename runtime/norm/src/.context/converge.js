/**
 * A context that declares convergence converges every component that stores anything, and no
 * manifest says so. An extension is loaded, deployed and hooked because a component's
 * `extensions` names it, so this is where they come to name it.
 *
 * It runs after the components are read and before the dependencies are resolved, so
 * everything downstream works as it does for an extension a manifest declared. There is
 * nothing per-component to normalize: the extension takes no declaration of its own.
 *
 * @param {toa.norm.Context} context
 * @returns {void}
 */
export const converge = (context) => {
  if (context.annotations?.[REFERENCE] === undefined) return

  for (const component of context.components ?? []) {
    if (component.entity === undefined) continue

    component.extensions ??= {}
    component.extensions[REFERENCE] ??= null
  }
}

const REFERENCE = '@toa.io/extensions.convergence'
