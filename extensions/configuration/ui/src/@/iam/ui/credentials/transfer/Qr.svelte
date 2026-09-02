<script lang="ts">
  import QRCode from 'qrcode'
  import { Spinner } from '$ui/spinner'
  import type { Props } from './Qr'

  const { value }: Props = $props()

  let src = $state<string | null>(null)

  $effect(() => {
    void QRCode.toDataURL(value, { width: 256, margin: 1 }).then(
      (data) => (src = data),
      () => (src = null),
    )
  })
</script>

<div class="bg-background mx-auto grid size-64 place-items-center rounded-lg border p-2">
  {#if src}
    <img {src} alt="" class="size-full" width="256" height="256" />
  {:else}
    <Spinner />
  {/if}
</div>
