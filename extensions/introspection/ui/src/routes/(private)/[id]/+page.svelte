<script lang="ts">
  import { Map, unslug } from '@/introspection/ui/map'
  import { page } from '$app/state'

  const focus = $derived(unslug(page.params.id ?? ''))
</script>

<Map class="h-full" {focus} />
