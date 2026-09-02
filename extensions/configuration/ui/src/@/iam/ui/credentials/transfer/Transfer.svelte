<script lang="ts">
  import { ChevronRight, QrCode } from '@lucide/svelte'
  import { challenge } from '@/iam'
  import { buttonVariants } from '$ui/button'
  import * as AlertDialog from '$ui/alert-dialog'
  import { convert } from '$lib/tools'
  import { browser, dev } from '$app/environment'
  import { dict } from '../../intl'
  import Qr from './Qr.svelte'
  import type { Props } from './Transfer'

  const { class: classes }: Props = $props()

  const url = $derived(
    browser && $challenge
      ? `${location.origin}/#challenge=${convert.toBase64Url($challenge)}`
      : null,
  )

  function onOpenChange(open: boolean) {
    if (!open && dev && url) void navigator.clipboard.writeText(url)
  }
</script>

<AlertDialog.Root {onOpenChange}>
  <AlertDialog.Trigger
    class={[
      buttonVariants({ variant: 'ghost', size: 'sm' }),
      'text-muted-foreground justify-start gap-1',
      classes,
    ]}>
    <QrCode class="size-4" />
    {$dict.credentials.transfer.action}
    <ChevronRight class="size-4 opacity-60" />
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{$dict.credentials.transfer.title}</AlertDialog.Title>
      <AlertDialog.Description>{$dict.credentials.transfer.description}</AlertDialog.Description>
    </AlertDialog.Header>
    {#if url}
      <Qr value={url} />
    {/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel>{$dict.credentials.transfer.done}</AlertDialog.Cancel>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
