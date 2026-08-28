<script lang="ts">
  import { account } from '@/iam'
  import { authorize, type Props } from './Authorized'

  const { children, ...checks }: Props = $props()
  const allowed = $derived(authorize(checks, $account))
</script>

{#if allowed}
  {@render children()}
{/if}
