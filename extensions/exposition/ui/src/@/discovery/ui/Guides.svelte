<script lang="ts">
  import { resolve } from '$app/paths'
  import { query } from './ui'
  import { dict } from './intl'
  import Guide from './Guide.svelte'
  import type { Props } from './Guides'

  const { class: className, ...props }: Props = $props()
</script>

{#if $query === ''}
  <div
    class={['grid grid-cols-1 gap-2 md:grid-cols-2', className]}
    {...props}
  >
    <Guide
      id="discovery-authentication-link"
      href={resolve('/authentication/')}
      title={$dict.guide.authentication.title}
    />

    <Guide
      id="discovery-status-link"
      href={resolve('/status/')}
      title={$dict.guide.status.title}
    />

    <Guide
      id="discovery-queries-link"
      href={resolve('/queries/')}
      title={$dict.guide.queries.title}
    />

    <Guide
      id="discovery-multipart-link"
      href={resolve('/multipart/')}
      title={$dict.guide.multipart.title}
    />
  </div>
{/if}
