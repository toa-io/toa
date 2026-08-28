<script lang="ts">
  import { oidc } from '@/iam'
  import { Spinner } from '$ui/spinner'
  import { Button } from '$ui/button'
  import { cn } from '$lib/utils'
  import { icons } from './icons'
  import type { Props } from './Button'

  const { idp, children, account, class: classes }: Props = $props()

  const Icon = $derived(icons[idp])

  async function onclick(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement

    button.disabled = true

    await oidc.authenticate(idp, account?.id)

    button.disabled = false
  }
</script>

<Button
  variant="outline"
  size={children ? 'default' : 'icon'}
  {onclick}
  class={cn(
    'disabled:[&_.x-icon]:hidden [&_.x-spinner]:hidden disabled:[&_.x-spinner]:block',
    classes,
  )}
>
  <Icon class="x-icon" />
  <Spinner class="x-spinner" />
  {@render children?.()}
</Button>
