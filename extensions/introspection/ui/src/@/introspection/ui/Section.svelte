<script lang="ts">
  import type { Props } from './Section'

  const { title, children, class: className }: Props = $props()
</script>

<section class={['flex flex-col gap-1', className]}>
  <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
  {@render children()}
</section>
