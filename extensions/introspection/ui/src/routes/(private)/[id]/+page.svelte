<script lang="ts">
  import { page } from '$app/state'
  import { Map, unslug } from '#/introspection/ui/map/index.js'

  const focus = $derived(unslug(page.params.id ?? ''))
</script>

<Map class="h-full" {focus} />
