<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements'

  /**
   * The Model Context Protocol mark, drawn as a lucide icon is: `currentColor`, sized by
   * the `size-*` a caller gives it. The glyph alone — the wordmark beside it in the source
   * says the name a second time, which a row of icons has no room for.
   *
   * Taken from the specification's own logo, `docs/logo/light.svg` of
   * github.com/modelcontextprotocol/modelcontextprotocol, whose documentation — which is
   * where it lives — that repository licenses CC-BY-4.0. Attribution is this comment.
   */
  const { class: className, ...props }: SVGAttributes<SVGElement> = $props()
</script>

<svg
  viewBox="0 0 195 195"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  class={className}
  {...props}
>
  <path
    d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177"
    stroke="currentColor"
    stroke-width="12"
    stroke-linecap="round"
  />
  <path
    d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52"
    stroke="currentColor"
    stroke-width="12"
    stroke-linecap="round"
  />
  <path
    d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822"
    stroke="currentColor"
    stroke-width="12"
    stroke-linecap="round"
  />
</svg>
