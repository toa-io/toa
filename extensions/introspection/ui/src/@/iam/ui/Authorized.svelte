<script lang="ts">
  import { account } from '@/iam'
  import { Clipboard } from '$lib/components/clipboard'
  import { dict } from './intl'
  import { authorize, type Props } from './Authorized'

  const { children, denied, ...checks }: Props = $props()

  const allowed = $derived(authorize(checks, $account))
  const id = $derived($account?.id ?? '')

  /** As much of an id as a person reads before they trust the clipboard has the rest. */
  const SHORT = 8
</script>

{#if allowed}
  {@render children()}
{:else if denied !== undefined}
  {@render denied()}
{:else if id !== ''}
  <!-- nothing to read: what is missing is a role on this account, and all the reader can
       do about it is hand their id to whoever grants one -->
  <div class="flex justify-center pt-[14vh]">
    <Clipboard
      text={id}
      label={id.slice(0, SHORT)}
      aria-label={$dict.auth.copyId}
      variant="outline"
      class="font-mono"
    />
  </div>
{/if}
