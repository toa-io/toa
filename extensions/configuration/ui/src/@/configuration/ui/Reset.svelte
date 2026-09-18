<script lang="ts">
  import { RotateCcw } from '@lucide/svelte'
  import { reset } from '@/configuration'
  import { Hold } from '$com/hold'
  import { dict } from './intl'
  import type { Props } from './Reset'

  const { component }: Props = $props()

  let failed = $state(false)

  async function onclick(): Promise<void> {
    failed = false
    failed = (await reset(component)) instanceof Error
  }
</script>

<!-- held rather than clicked: what the component was given is gone once it lets go -->
<Hold
  id="configuration-reset-button"
  name="configuration-reset"
  variant="destructive"
  size="sm"
  label={$dict.reset.hold}
  {onclick}
>
  <RotateCcw />
  {$dict.reset.action}
</Hold>

{#if failed}
  <p class="text-destructive text-xs">{$dict.reset.failed}</p>
{/if}
