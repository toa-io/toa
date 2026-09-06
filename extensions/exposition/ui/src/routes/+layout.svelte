<script lang="ts">
  import './layout.css'
  import { navigate } from '$lib/tools'
  import { dict } from '$lib/intl'
  import { meta } from '$config'
  import { page } from '$app/state'
  import { onNavigate } from '$app/navigation'

  const { children } = $props()
  const title = $derived(page.data.meta?.title ?? meta.title)
  const description = $derived(page.data.meta?.description ?? meta.description)

  onNavigate(navigate)

  $effect(() => {
    document.dir = $dict.dir
  })
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>

{@render children()}
